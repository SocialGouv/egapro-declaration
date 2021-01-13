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
  catch (e) {
    response.data = null
  }
  if(response.status == 401) {
    const error = response.json
    if(response.data.error) notify.error(response.data.error)
    delete localStorage.token
    redirect('./')
  }
  // if(!response.ok && response.data) notify.error(response.data.error)
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
  timeout: null,

  get toast() {
    return document.querySelector('#toast')
  },

  set message(text) {
    try {
      document.querySelector('#toast .message').textContent = text
    } catch (e) {
      alert(text)
    }
  },

  show(message, type) {
    if(!this.toast) return
    clearTimeout(this.timeout)
    this.message = message
    this.toast.classList.add('visible', type)
  },

  close() {
    if(!this.toast) return
    this.toast.classList = []
    this.timeout = setTimeout(() => (this.message = ""), 3000)
  },

  warning(message) {
    this.show(message, 'warning')
  },

  info(message) {
    this.show(message, 'info')
  },

  error(error, data) {
    this.show(error, 'error')
    if (typeof Sentry !== "undefined") {
      Sentry.captureException(error, {
        extra: data || app.data
      })
    }
  }
}

validateNotAllEmpty = message => {
  return event => {
    // We don't want to require ALL the fields, but we need at least one
    const allInputs = Array.from(document.querySelectorAll("[data-not-all-empty]"))
    if (allInputs.every(input => input.value === "")) {
      notify.warning(message)
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

extractKey = flatKey => {
  // This extracts "foobar[0]" into ["foobar[0]", "foobar", "0"]
  return flatKey.match(/([^\[]+)\[?(\d+)?\]?/);
}

class AppStorage {
  constructor() {
    this.config = {}
    this.schema = {}
    this.apiUrl = ['localhost', '127.0.0.1'].includes(location.hostname)
      ? 'http://localhost:2626'
      : `${location.origin}/api`;
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

  dataToLocalStorage() {
    localStorage.data = JSON.stringify(this.data)
  }

  async loadConfig() {
    const response = await request('GET', '/config')
    if(!response.ok) notify.error("Le serveur ne répond pas. Veuillez contacter l'équipe technique.")
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

  set annee(annee) {
    return this.setItem('déclaration.année_indicateurs', Number(annee))
  }

  get annee() {
    return this.getItem('déclaration.année_indicateurs')
  }

  set siren(siren) {
    return this.setItem('entreprise.siren', siren)
  }

  get siren() {
    return this.getItem('entreprise.siren')
  }

  get isDraft() {
    return this.data.déclaration.brouillon
  }

  set isDraft(value) {
    this.data.déclaration.brouillon = value
  }

  get mode() {
    if(!this.getItem('déclaration.date')) return "creating"
    if(this.isDraft) return "updating"
    return "reading"
  }

  getItem(flatKey) {
    const keys = flatKey.split(".");
    try {
      const value = keys.reduce((item, currentKey) => {
        const [_, key, index] = extractKey(currentKey);
        return index ? item[key][index] : item[key];
      }, this.data);
      return value !== undefined ? value : "";
    } catch (e) {
      // Fail silently if the item doesn't exist yet
      return "";
    }
  }

  setItem(flatKey, val) {
    // Deeply set a value in data given a flatKey like `entreprise.ues.entreprises[0].raison_sociale`
    const keys = flatKey.split(".");
    const ancestors = keys.slice(0, -1);
    const property = keys.pop();

    const target = ancestors.reduce((parent, name) => {
      const [_, key, index] = extractKey(name);
      // parent is an array
      if (index) {
        if (!(key in parent)) parent[key] = [];
        if (!parent[key][index]) parent[key][index] = {};
        return parent[key][index];
      }
      // parent is an object
      else {
        if (!(key in parent)) parent[key] = {};
        return parent[key];
      }
    }, this.data);

    // Set the value on the item
    const [_, key, index] = extractKey(property);
    if (index) {
      if (!(key in target)) target[key] = [];
      target[key][index] = val;
    } else {
      target[key] = val;
    }
  }

  delItem(flatKey) {
    // Delete a nested value from a flat key
    const keys = flatKey.split(".");
    let item = this.data;
    while (keys.length > 1) {
      const [_, key, index] = extractKey(keys.shift());
      if (!(key in item)) {
        // This item doesn't exist yet
        return;
      }
      if (index && !item[key][index]) {
        return;
      }
      item = index ? item[key][index] : item[key];
    }
    // Only one key left, it's the one that identifies the item we want to delete
    const [_, key, index] = extractKey(keys.shift());
    if (!(key in item)) {
      return;
    }
    if (index) {
      delete item[key][index];
    } else {
      delete item[key];
    }
  }

  async save(data, event) {
    data = Object.assign(this.data, data)
    const schemaData = this.filterSchemaData(data)
    const response = await request('PUT', `/declaration/${this.siren}/${this.annee}`, schemaData)
    if(response.ok) {
      Object.assign(this.data, schemaData)
      this.dataToLocalStorage()
    }
    // Only alert if we have an event: if we were called from a form submit (not from a `refreshForm`)
    else if(response.data.error && event) notify.error(response.data.error)
    return response
  }
}
