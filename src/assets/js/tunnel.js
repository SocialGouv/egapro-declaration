const form = document.getElementById('page-form')
const progress = document.querySelector('progress')
const previousButton = document.querySelector('a[rel=prev]')
const nextButton = document.querySelector('button[rel=next]')
const steps = [
   {name: 'commencer'},
   {name: 'declarant'},
   {name: 'annee', nextStep: data => {
    if(data['entreprise.structure'] === 'ues') return 'ues'
    return 'entreprise'
  }},
  {name: 'ues'},
  {name: 'ues-composition', nextStep: _ => 'remuneration'},
  {name: 'entreprise', nextStep: _ => 'remuneration'},
  {name: 'remuneration', nextStep: data => {
    if (data['indicateur.calcul'] === "coef") return 'remuneration-coef'
    if (data['indicateur.calcul'] === "csp") return 'remuneration-csp'
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

const path = location.pathname
const pageName = path.slice(1, path.lastIndexOf('.'))
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
      alert(e)
      return
    }
  }

  const response = await sendData(data)
  if(!response.ok) return

  const nextStep = steps[step].nextStep
  if (nextStep) {
    return redirect(`/${nextStep(data)}.html`)
  }
  return redirect(`/${steps[step + 1].name}.html`)
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
  const formData = new FormData(form)
  var data = {}
  formData.forEach((value, key) => {
      data[key] = value
  })
  return data
}

function validateData(data = {}) {
  return Object.keys(data).reduce((acc, key) => {
    // Some keys are for internal use only, not corresponding to the schema
    if(!Object.keys(app.schema).includes(key)) return
    let value = data[key]
    const validator = app.schema[key]
    if(validator.type === 'string') value = String(value)
    if(validator.type === 'integer') value = Number(value)
    return Object.assign(acc, { [key]: value })
  }, {})
}

async function sendData(data) {
  const cleanedData = validateData(data)
  Object.assign(app.data, cleanedData)
  /* discussion avec @ybon au 2 novembre 2020
  le PATCH ne fonctionne que sur les clés de premier niveau en l'état
  donc si tu passes "entreprise", il écrase "entreprise", mais pas les autres clés de premier niveau
  // const method = app.isNew ? 'PUT' : 'PATCH'
  */
  const response = await request('PUT', `/declaration/${app.data["entreprise.siren"]}/${app.data["déclaration.année_indicateurs"]}`, app.data)
  if(response.ok) localStorage.data = JSON.stringify(app.data)
  else if(response.data.error) notify.error(response.data.error)
  return response
}

function loadFormValues(form, data = {}) {
  Object.keys(data).forEach((prop) => {
    const node = form.elements[prop]
    if(node) node.value = data[prop]
    if(!node) {
      // debugger
    }
  })
}
