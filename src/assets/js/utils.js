async function loadApp() {
  window.app = window.app || {
    data: {},
    regions: null,
    config: {},
  }

  const response = await request('GET', '/config')
  if(!response.ok) {
    Object.entries(response.data).forEach(([key, value]) => {
      window.app.config[key.toLowerCase()] = value
    })
  }
}


async function request(method, uri, body, options = {}) {
  if(!['get', 'head'].includes(method.toLowerCase()))
    options.body = body ? JSON.stringify(body) : ""
  options.method = method
  options.headers = { 'API-KEY': localStorage.token }
  const response = await fetch(`${apiUrl}${uri}`, options)
  try {
    response.data = await response.json()
  }
  catch {
    response.data = null
  }
  if(!response.ok && response.data) alert(response.data.error)
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

// Shortcut event
window.addEventListener('DOMContentLoaded', async () => {
  await loadApp()
  document.onready && document.onready()
})
