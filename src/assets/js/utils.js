/**
 * 1. Prepare a global `app` object
 * 2. import api config
 * 3. import api schema
 * 4. import existing record
 */
async function loadApp() {
  window.app = window.app || {
    // Config from server /config
    config: {},
    // User form data that is got and sent to the API
    data: {},
    // JSON validation and structure schema
    schema: {},
    // Required data for communication with the API
    token: localStorage.token,
    siren: localStorage.siren,
    annee: localStorage.annee,
  }

  // Load config
  const config = await request('GET', '/config')
  if(!config.ok) alert("Le serveur ne répond pas. Veuillez contacter l'équipe technique.")
  Object.entries(config.data).forEach(([key, value]) => {
    app.config[key.toLowerCase()] = value
  })

  if(!app.token) return

  // Load JSON Schema
  const schema = await request('GET', '/jsonschema.json')
  app.schema = flattenJsonSchema(schema.data)

  // Load existing record
  if(app.siren && app.annee) {
    const record = await request('GET', `/declaration/${app.siren}/${app.annee}`)
    if(record.ok) {
      app.data = record.data.data
    }
    else delete localStorage.data
  }
}

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
  await loadApp()
  document.dispatchEvent(new Event('ready'))
  document.onready && document.onready()
})

notify = {
  error(message) {
    alert(message)
  }
}
