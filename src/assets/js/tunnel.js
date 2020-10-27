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

window.data = JSON.parse(localStorage.data || '{}')

loadFormValues(form, data)

progress.max = steps.length - 1
progress.value = step

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const form = event.target
  const data = formToData(form)
  let shouldSendData = true

  if(typeof document.onsend === 'function') {
    try {
      if(await document.onsend(data) === false) shouldSendData = false
    } catch(e) {
      alert(e)
      return
    }
  }

  if(shouldSendData) {
    const response = await sendData(data)
    if(!response.ok) return
  }

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

function formToData(form) {
  const formData = new FormData(form)
  var data = {}
  formData.forEach((value, key) => {
      data[key] = value
  })
  return data
}

async function sendData(data) {
  const cleanedData = Object.keys(data).reduce((acc, k) => {
    let value = data[k]
    if(!isNaN(parseInt(value)) && String(parseInt(value)).length === value.length) value = parseInt(value)
    acc[k] = value
    return acc
  }, {})
  // const response = await request('PUT', `/declaration/${localStorage.siren}/${localStorage.annee}`, cleanedData)
  const response = { ok: true }  // while server is not available in staging
  if(response.ok) localStorage.data = JSON.stringify(Object.assign(window.data, data))
  return response
}

function loadFormValues(form, data) {
  Object.keys(data).forEach((prop) => {
    const node = form.elements[prop]
    if(node) node.value = data[prop]
    if(!node) {
      // debugger
    }
  })
}
