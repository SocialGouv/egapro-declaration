async function request(method, uri, body, options = {}) {
  if(!['get', 'head'].includes(method.toLowerCase()))
    options.body = body ? JSON.stringify(body) : ""
  options.method = method
  options.headers = {
    'API-KEY': localStorage.token,
  }
  const response = await fetch(`${app.apiUrl}${uri}`, options)

  try {
    response.data = await response.json()
  }
  catch {
    response.data = null
  }
  if(response.status == 401) {
    const error = response.json
    if(response.data.error) notify.error(response.data.error)
    delete localStorage.token
    redirect('..')
  }
  // if(!response.ok && response.data) alert(response.data.error)
  return response
}

function redirect(url) {
  location.href = url
}

/**
 * Read the deep value from an object without raising an error.
 * While conditional chaining (ie: `obj.prop?.val?.here = "yes"`)
 * is not widely spread yet.
 * Usage: objectValue(obj, 'prop', 'val', 'here') # => "yes"
 */
function objectValue() {
  const properties = Array.from(arguments)
  const object = properties.shift()
  return properties.reduce((acc, prop) => {
    try {
      return acc[prop]
    }
    catch {}
  }, object)
}

function buildSelectOptions(select, list, value) {
  select.innerHTML = ""
  if(select.hasAttribute('empty')) list.unshift({ value: "", label: " ––– " })
  list.forEach((val) => {
    const option = document.createElement('option')
    option.value = val.value
    option.textContent = val.label
    if(option.value == value) option.selected = 'selected'
    select.appendChild(option)
  })
}

async function getNafCodes() {
  const response = await request('GET', '/config?key=NAF')
  return response.data.NAF
}

async function buildNafOptions(optgroup, value, attributes = {}) {
  const nafs = await getNafCodes()

  const options = Object.keys(nafs).map(code => ({ value: code, label: `${code} — ${nafs[code]}` }))
  buildSelectOptions(optgroup, options, value, attributes)
}

function selectField(name) {
  const field = document.getElementById(`field--${name}`)
  if(!field) throw new Error(`field name "${name}" does not exist.`)
  return field
}

function enableField(selector, enabled) {
  document.querySelector(selector).disabled = !enabled
}

// Shortcut event
window.addEventListener('DOMContentLoaded', async () => {
  app = new AppStorage()
  await app.init()
  document.onready && await document.onready()
  document.dispatchEvent(new Event('ready'))
  document.onloaded && document.onloaded()
})

notify = {
  error(message) {
    alert(message)
  }
}

validateNotAllEmpty = message => {
  return event => {
    // We don't want to require ALL the fields, but we need at least one
    const allInputs = Array.from(document.querySelectorAll("input[type='number']"))
    if (allInputs.every(input => input.value === "")) {
      alert(message)
      return false
    }
    return true
  }
}

checkSirenValidity = async event => {
  const target = event.target

  checkPatternValidity(event)
  if (target.validity.patternMismatch) {
    // We already treated this case in `checkPatternValidity`
    return
  }

  if (target.validity.valueMissing) {
    // Keep the default browser behavior
    return
  }

  const allSirens = Array.from(document.querySelectorAll("input.siren")).map(node => node.value)
  if (allSirens.filter(siren => siren === target.value).length >= 2) {
    // We check if the length is >= 2 because the list of sirens also contains the current value
    target.setCustomValidity("Le Siren a déjà été saisi")
  } else if (!await isSirenValid(target.value)) {
    target.setCustomValidity("Le numéro Siren que vous avez saisi n'est pas valide")
  } else {
    target.setCustomValidity("")
  }
  target.reportValidity()
}

isSirenValid = async value => {
  const response = await request('GET', `/validate-siren?siren=${value}`)
  return response.ok
}

checkPatternValidity = event => {
  const target = event.target
  if (!target.placeholder) {
    // We don't have a custom message to offer, bail
    return
  }
  if (target.validity.patternMismatch) {
    const placeholder = target.placeholder
    target.setCustomValidity(`Veuillez respecter le format requis (${target.placeholder})`)
    target.reportValidity()
    return
  } else {
    target.setCustomValidity("")
    target.reportValidity()
  }
}

class AppStorage {
  constructor() {
    this.config = {}
    this.schema = {}
    this.apiUrl = ['localhost', '127.0.0.1'].includes(location.hostname)
      ? 'http://localhost:2626'
      : 'https://dev.egapro.fabrique.social.gouv.fr/api'
  }

  async init() {
    this.resetData()
    await this.loadConfig()
    await this.loadSchema()
    if(!this.token) return
    this.loadLocalData()
    // Is remote data actually necessary as we must have local data for token anyways?
    if(this.siren && this.annee) await this.loadRemoteData()
  }

  resetData() {
    this.data = { source: 'formulaire' }
  }

  async loadConfig() {
    const response = await request('GET', '/config')
    if(!response.ok) alert("Le serveur ne répond pas. Veuillez contacter l'équipe technique.")
    Object.entries(response.data).forEach(([key, value]) => {
      this.config[key.toLowerCase()] = value
    })
  }

  async loadSchema() {
    const response = await request('GET', '/jsonschema.json')
    this.schema = response.data
  }

  async loadLocalData() {
    Object.assign(this.data, JSON.parse(localStorage.data || '{}'))
  }

  async loadRemoteData() {
    const response = await request('GET', `/declaration/${this.siren}/${this.annee}`)
    if(response.status === 404) {
      // Brand new declaration, set it as "brouillon"
      this.isDraft = true
      await this.save()
    }
    if(response.ok) Object.assign(this.data, response.data.data)
    else {
      delete localStorage.data
      this.resetData()
    }
    return response
  }

  set token(token) {
    localStorage.token = token
  }

  get token() {
    return localStorage.token
  }

  filterSchemaData(data) {
    return Object.keys(data).reduce((acc, key) => {
      if(!key.startsWith('_') && Object.keys(data[key]).length !== 0) {
        // Items which start with "_" are only local and shouldn't be sent to the API
        // Items which are empty shouldn't either
        acc[key] = data[key]
      }
      return acc
    }, {})
  }

  get annee() {
    return objectValue(this.data, 'déclaration', 'année_indicateurs')
  }

  get siren() {
    return objectValue(this.data, 'entreprise', 'siren')
  }

  get isDraft() {
    return this.data.déclaration.brouillon
  }

  set isDraft(value) {
    this.data.déclaration.brouillon = value
  }

  get mode() {
    if(!objectValue(this.data, 'déclaration', 'date')) return "creating"
    if(this.isDraft) return "updating"
    return "reading"
  }

  deleteKey(key) {
    delete this.data[key]
  }

  async save(data, event) {
    data = Object.assign(this.data, data)
    const schemaData = this.filterSchemaData(data)
    const response = await request('PUT', `/declaration/${this.siren}/${this.annee}`, schemaData)
    if(response.ok) {
      Object.assign(this.data, schemaData)
      localStorage.data = JSON.stringify(this.data)
    }
    // Only alert if we have an event: if we were called from a form submit (not from a `refreshForm`)
    else if(response.data.error && event) notify.error(response.data.error)
    return response
  }
}
