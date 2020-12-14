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

validateNotAllEmpty = event => {
  // We don't want to require ALL the fields, but we need at least one
  const allInputs = Array.from(document.querySelectorAll("input[type='number']"))
  if (allInputs.every(input => input.value === "")) {
    alert("Il vous faut renseigner au moins un des écarts de rémunération si votre indicateur est calculable")
    return false
  }
  return true
}

isSirenValid = async value => {
  const response = await request('GET', `/validate-siren?siren=${value}`)
  return response.ok
}

class AppStorage {
  constructor() {
    this.data = {}
    this.config = {}
    this.schema = {}
    this.apiUrl = ['localhost', '127.0.0.1'].includes(location.hostname)
      ? 'http://localhost:2626'
      : 'https://dev.egapro.fabrique.social.gouv.fr/api'
  }

  async init() {
    await this.loadConfig()
    await this.loadSchema()
    if(!this.token) return
    this.loadLocalData()
    // Is remote data actually necessary as we must have local data for token anyways?
    if(this.siren && this.annee) await this.loadRemoteData()
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
    if(response.ok) Object.assign(this.data, response.data.data)
    else {
      delete localStorage.data
      this.data = {}
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
    return this.data["déclaration"]?.["année_indicateurs"]
  }

  get siren() {
    return this.data["entreprise"]?.["siren"]
  }

  get isDraft() {
    // TODO: replace with the following once the API allows it
    // return this.data.déclaration.statut === "brouillon"
    return this.data._statut === "brouillon"
  }

  set isDraft(value) {
    // TODO: send to the server when toggling to "brouillon" status
    this.data._statut = value ? "brouillon" : ""
    this.save()
  }

  get mode() {
    if(!this.data["déclaration"]?.["date"]) return "creating"
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
