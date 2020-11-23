const form = document.getElementById('page-form')
const progress = document.querySelector('progress')
const previousButton = document.querySelector('a[rel=prev]')
const nextButton = document.querySelector('button[rel=next]')
const steps = [
   {name: 'commencer'},
   {name: 'declarant'},
   {name: 'annee', nextStep: data => {
    if(getVal(data, '_entreprise.structure') === 'ues') return 'ues'
    return 'entreprise'
  }},
  {name: 'ues'},
  {name: 'ues-composition', nextStep: _ => 'remuneration'},
  {name: 'entreprise', nextStep: _ => 'remuneration'},
  {name: 'remuneration', nextStep: data => {
    if (getVal(data, 'indicateurs.rémunérations.mode') === "coef") return 'remuneration-coef'
    if (getVal(data, 'indicateurs.rémunérations.mode') === "autre") return 'remuneration-coef'
    if (getVal(data, 'indicateurs.rémunérations.mode') === "csp") return 'remuneration-csp'
    return 'augmentation'
  }},
  {name: 'remuneration-coef', nextStep: _ => 'remuneration-final'},
  {name: 'remuneration-autre', nextStep: _ => 'remuneration-final'},
  {name: 'remuneration-csp', nextStep: _ => 'remuneration-final'},
  {name: 'remuneration-final'},
  {name: 'augmentation'},
  {name: 'maternite'},
  {name: 'hautesremunerations'},
  {name: 'note'},
  {name: 'resultat'},
  {name: 'validation'},
  {name: 'transmission'}
]

const fileName = location.pathname.lastIndexOf('/') < 0 ? location.pathname : location.pathname.split('/').pop()
const pageName = fileName.split('.')[0]
const step = steps.findIndex(step => step.name === pageName)


document.addEventListener('ready', () => {
  if(!app.token) location.href = '/'
  loadFormValues(form, app.data)
})

progress.max = steps.length - 1
progress.value = step

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const form = event.target
  const data = serializeForm(form)

  if(typeof document.onsend === 'function') {
    try {
      await document.onsend(data)
    } catch(e) {
      return alert(e)
    }
  }

  const response = await app.save(data)
  if(!response.ok) return
  const nextStep = steps[step].nextStep
  if (nextStep) return redirect(`${nextStep(data)}.html`)
  else return redirect(`${steps[step + 1].name}.html`)
})

// "Previous" button
if (step > 0) {
  previousButton.onclick = (e) => {
    e.preventDefault()
    history.back()
  }
}
else {
  previousButton.setAttribute('disabled', 'disabled')
}

// "Next" button
if(step >= steps.length - 1) {
  nextButton.setAttribute('disabled', 'disabled')
}

function serializeForm(form) {
  let data = app.data

  // Only the fields that have names are of interest for us (not submit buttons)
  const allFields = Array.from(form.elements).filter(field => field.name)

  const formData = new FormData(form)
  formData.forEach((value, key) => {
      const field = allFields.find(node => node.name === key)
      if (field.dataset.validation === 'Number') {
        value = Number(value)
      }
    setVal(data, key, value)
  })

  // Get all the names of the fields that aren't disabled (and thus included in FormData)
  const enabledFields = Array.from(formData).map(formDataItem => formDataItem[0])

  // We need to force remove disabled fields that might have been set previously
  allFields.forEach(field => {
    if (!enabledFields.includes(field.name)) {
      delVal(app.data, field.name)
    }
  })
  return data
}

function loadFormValues(form, data = {}) {
  Array.from(form.elements).forEach(node => {
    const value = getVal(data, node.name)
    if (!node.name) return
    if (node.type === "radio") {
      node.checked = node.value === value
    } else {
      node.value = value
    }
  })
}

function keyFromFlatKey(flatKey) {
  // Change "entreprise.ues.entreprises.0.raison_sociale" to '["entreprise"]["ues"]["entreprises"]["0"]["raison_sociale"]'
  return flatKey.split(".").map(key => `["${key}"]`).join('')
}

function getVal(data, flatKey) {
  const keys = flatKey.split('.')
  try {
    const value = keys.reduce((item, key) => {
      return item[key]
    }, data)
    return value || ''
  } catch {
    // Fail silently if the item doesn't exist yet
    return ''
  }
}

function setVal(data, flatKey, val) {
  const keys = flatKey.split('.')
  let item = data
  while (keys.length > 1) {
    const key = keys.shift()
    if (!(key in item)) { // This item doesn't exist yet
      item[key] = {}
    }
    item = item[key]
  }
  // Only one key left, it's the one that identifies the item we want to set
  item[keys[0]] = val
}

function delVal(data, flatKey) {
  // Delete a nested value from a flat key
  const keys = flatKey.split('.')
  let item = data
  while (keys.length > 1) {
    const key = keys.shift()
    if (!(key in item)) { // This item doesn't exist yet
      return
    }
    item = item[key]
  }
  // Only one key left, it's the one that identifies the item we want to delete
  delete item[keys[0]]
}
