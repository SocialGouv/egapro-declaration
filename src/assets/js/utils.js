/**
 * 1. Prepare a global `app` object
 * 2. import api config
 * 3. import api schema
 * 4. import existing record
 */
async function loadApp() {
  window.app = window.app || {
    regions: null,
    config: {},
    data: {},
    schema: {},
    token: localStorage.token,
    isNew: Boolean(localStorage.siren && localStorage.annee),
    siren: localStorage.siren,
    annee: localStorage.annee,
  }

  // Load config
  const config = await request('GET', '/config')
  if(!config.ok) alert("Le serveur ne répond pas. Veuillez contacter l'équipe technique.")
  Object.entries(config.data).forEach(([key, value]) => {
    window.app.config[key.toLowerCase()] = value
  })

  if(!window.app.token) return

  // Load JSON Schema
  const schema = await request('GET', '/jsonschema.json')
  window.app.schema = flattenJsonSchema(schema.data)
  // Load existing record
  if(app.siren && app.annee) {
    const record = await request('GET', `/declaration/${app.siren}/${app.annee}`)
    if(record.ok) {
      localStorage.data = JSON.stringify(record.data.data)
      window.app.isNew = false
    }
  }
  window.app.data = JSON.parse(localStorage.data || '{}')
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

function buildRadioOptions(optgroup, list, value) {
  const name = optgroup.getAttribute('name')
  optgroup.innerHTML = list.map((val) => {
    const content = `<label>
    <input type="radio" name="${name}" value="${val.value}" ${val.value == value ? 'checked' : ''}>
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
