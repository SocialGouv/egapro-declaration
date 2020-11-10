const form = document.getElementById('page-form')
const progress = document.querySelector('progress')
const previousButton = document.querySelector('a[rel=prev]')
const nextButton = document.querySelector('button[rel=next]')
const steps = [
   {name: 'commencer'},
   {name: 'declarant'},
   {name: 'annee', nextStep: data => {
    if(data['_entreprise.structure'] === 'ues') return 'ues'
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
  const formData = new FormData(form)
  var data = {}
  formData.forEach((value, key) => {
      data[key] = value
  })
  return data
}

function loadFormValues(form, data = {}) {
  Object.keys(data).forEach((prop) => {
    const node = form.elements[prop]
    if(node) node.value = data[prop]
  })
}
