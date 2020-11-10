async function request(method, uri, body, options = {}) {
  if(!['get', 'head'].includes(method.toLowerCase()))
    options.body = body ? JSON.stringify(body) : ""
  options.method = method
  options.headers = {
    'API-KEY': localStorage.token,
    'ACCEPT': 'application/vnd.egapro.v1.flat',
  }
  const response = await fetch(`${apiUrl}${uri}`, options)

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

function buildRadioOptions(optgroup, list, value, attributes = {}) {
  const name = optgroup.getAttribute('name')
  optgroup.innerHTML = list.map((val) => {
    const content = `<label>
    <input type="radio" name="${name}" value="${val.value}" ${val.value == value ? 'checked' : ''} ${Object.entries(attributes).map(([key, value]) => `${key}="${value}"`).join(' ')}>
    ${val.label}
    </label>`
    const wrapped = optgroup.hasAttribute('option-block') ? `<div>${content}</div>` : content
    return wrapped
  }).join('')
}

function selectField(name) {
  const field = document.getElementById(`field--${name}`)
  if(!field) throw new Error(`field name "${name}" does not exist.`)
  return field
}

function flattenJsonSchema(jsonSchema) {
  return Object.keys(jsonSchema.properties).reduce((acc = {}, key) => {
    const category = jsonSchema.properties[key]
    const props = category.properties
    if(!props) return
    Object.keys(props).forEach(prop => {
      const value = props[prop]
      value.required = category.required && category.required.includes(prop)
      acc[`${key}.${prop}`] = value
    })
    return acc
  }, {})
}

function flattenJson(json) {
  return Object.keys(json).reduce((acc = {}, key) => {
    const props = json[key]
    if(!props) return
    Object.keys(props).forEach(prop => {
      const value = props[prop]
      value.required = category.required && category.required.includes(prop)
      acc[`${key}.${prop}`] = value
    })
    return acc
  }, {})
}

// Shortcut event
window.addEventListener('DOMContentLoaded', async () => {
  app = new AppStorage()
  await app.init()
  document.dispatchEvent(new Event('ready'))
  document.onready && document.onready()
})

notify = {
  error(message) {
    alert(message)
  }
}


class AppStorage {
  constructor() {
    this.data = {}
    this.config = {}
    this.schema = {}
  }

  async init() {
    await this.loadConfig()
    await this.loadSchema()
    if(!this.token) return
    this.loadLocalData()
    // Is remote data actually necessary as we must have local data for token anyways?
    // if(this.siren && this.annee) await this.loadRemoteData()
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
    this.schema = flattenJsonSchema(response.data)
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
  }

  set token(token) {
    localStorage.token = token
  }

  get token() {
    return localStorage.token
  }

  validateSchema(data) {
    return Object.keys(data).reduce((acc, key) => {
      // Some keys are for internal use only, not corresponding to the schema
      let value = data[key]
      if(!Object.keys(this.schema).includes(key)) throw new Error(`key ${key} is not in jsonschema.`)
      const validator = this.schema[key]
      if(validator.type === 'string') value = String(value)
      if(validator.type === 'integer') value = Number(value)
      return Object.assign(acc, { [key]: value })
    }, {})
  }

  filterSchemaData(data) {
    return Object.keys(data).reduce((acc, key) => {
      if(!key.startsWith('_')) acc[key] = data[key]
      return acc
    }, {})
  }

  get annee() {
    return app.data["déclaration.année_indicateurs"]
  }

  get siren() {
    return app.data["entreprise.siren"]
  }

  async save(data) {
    const schemaData = this.filterSchemaData(data)
    const cleanedData = this.validateSchema(schemaData)
    const response = await request('PUT', `/declaration/${this.siren}/${this.annee}`, cleanedData)
    if(response.ok) {
      Object.assign(this.data, cleanedData)
      localStorage.data = JSON.stringify(this.data)
    }
    else if(response.data.error) notify.error(response.data.error)
    return response
  }
}
