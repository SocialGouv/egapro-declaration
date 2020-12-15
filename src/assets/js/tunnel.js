const form = document.getElementById("page-form");
const progress = document.querySelector("progress");
const previousButton = document.querySelector("a[rel=prev]");
const nextButton = document.querySelector("button[rel=next]");
const steps = [
  { name: "commencer" },
  { name: "declarant" },
  { name: "perimetre",
    nextStep: (data) => {
      if (data._entreprise.structure === "ues") return "ues";
      return "informations";
    },
  },
  { name: "ues" },
  { name: "informations" },
  { name: "remuneration",
    nextStep: (data) => {
      if (data.indicateurs.rémunérations.mode === "niveau_branche")
        return "remuneration-coef";
      if (data.indicateurs.rémunérations.mode === "niveau_autre")
        return "remuneration-coef";
      if (data.indicateurs.rémunérations.mode === "csp")
        return "remuneration-csp";
      return data.entreprise.effectif.tranche === "50:250"
        ? "augmentations-et-promotions"
        : "augmentations";
    },
  },
  { name: "remuneration-coef", nextStep: (_) => "remuneration-final" },
  { name: "remuneration-autre", nextStep: (_) => "remuneration-final" },
  { name: "remuneration-csp", nextStep: (_) => "remuneration-final" },
  { name: "remuneration-final",
    nextStep: (data) =>
      data.entreprise.effectif.tranche === "50:250"
        ? "augmentations-et-promotions"
        : "augmentations",
  },
  // If tranche effectif is > 50:250
  { name: "augmentations" },
  { name: "promotions", nextStep: (_) => "maternite" },
  // If tranche effectif is 50:250
  { name: "augmentations-et-promotions" },
  //
  { name: "maternite" },
  { name: "hautes-remunerations" },
  { name: "note" },
  { name: "resultat" },
  { name: "validation" },
  { name: "transmission" },
];

const fileName =
  location.pathname.lastIndexOf("/") < 0
    ? location.pathname
    : location.pathname.split("/").pop();
const pageName = fileName.split(".")[0];
const step = steps.findIndex((step) => step.name === pageName);

document.addEventListener("ready", () => {
  if (!app.token) location.href = "/";
  loadFormValues(form, app.data);
  if (app.mode === "updating") {
    toggleDeclarationValidatedBar(true, true)
  } else if (app.mode === "reading") {
    toggleDeclarationValidatedBar(true, false)
    // Fields cannot be edited
    document.querySelectorAll('[name]').forEach(input => {
      input.setAttribute('readonly', true)
      if(input.matches('[type=radio]:not(:checked)')) input.disabled = true
      if(input.matches('select')) {
        Array.from(input.querySelectorAll('option'))
          .filter(option => !option.selected)
          .forEach(option => option.disabled = true)
      }
    })
  }
});

progress.max = steps.length - 1;
progress.value = step;

async function saveFormData (event) {
  event && event.preventDefault();

  const data = serializeForm(form);

  if (typeof document.onsend === "function") {
    try {
      await document.onsend(data);
    } catch (e) {
      return alert(e);
    }
  }

  return await app.save(data, event);
};

form.addEventListener("submit", async (event) => {
  event.preventDefault()
  if (typeof document.preFormSubmit === "function") {
    try {
      const result = await document.preFormSubmit(event)
      if (!result) return false
    } catch (e) {
      return alert(e)
    }
  }
  if (app.mode === "reading" && steps[step].name !== "validation") {
    alert("La déclaration a déjà été validée, les modifications éventuelles apportées à ce formulaire ne seront pas sauvegardées.")
  } else if(app.mode === 'creating') {
    const response = await saveFormData(event);

    if (!response.ok) return;
  }

  const nextStep = steps[step].nextStep;
  if (nextStep) return redirect(`${nextStep(app.data)}.html`);
  else return redirect(`${steps[step + 1].name}.html`);
});

const refreshForm = async (event) => {
  if (!event.target.checkValidity()) return

  let response = await saveFormData();

  if (!response.ok) return;

  response = await app.loadRemoteData();
  if (!response.ok) return;
  loadFormValues(form, app.data);
};

// "Previous" button
if (step > 0) {
  previousButton.onclick = (e) => {
    e.preventDefault();
    history.back();
  };
} else {
  previousButton.onclick = (e) => {
    // On the "commencer.html" page (the first) we display a "recommencer" button
    e.preventDefault();
    if (confirm("Recommencer une déclaration ?")) {
      app.data = {}
      delete localStorage.data
      // Reload the page, without the local data
      location.pathname = location.pathname
    }
  };
}

// "Next" button
if (step >= steps.length - 1) {
  nextButton.setAttribute("disabled", "disabled");
}

function serializeForm(form) {
  let data = app.data;

  // Only the fields that have names are of interest for us (not submit buttons)
  const allFields = Array.from(form.elements).filter((field) => field.name);

  const formData = new FormData(form);
  formData.forEach((value, key) => {
    if (!value) {
      return;
    }
    const field = allFields.find((node) => node.name === key);
    if (field.getAttribute("type") === "number") {
      value = Number(value);
    }
    setVal(data, key, value);
  });

  // Get all the names of the fields that aren't disabled (and thus included in FormData)
  const enabledFields = Array.from(formData).map(
    (formDataItem) => formDataItem[0]
  );

  // We need to force remove disabled fields that might have been set previously
  allFields.forEach((field) => {
    if (!enabledFields.includes(field.name) || field.value === "") {
      delVal(app.data, field.name);
    }
  });
  removeEmpty(data);
  return data;
}

function removeEmpty(data) {
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === "array") {
      if (!data[key].filter((item) => item !== undefined).length) {
        delete data[key];
      } else {
        removeEmpty(data[key]);
      }
    } else if (data[key] && typeof data[key] === "object") {
      if (!Object.keys(data[key]).length) {
        delete data[key];
      } else {
        removeEmpty(data[key]);
      }
    }
  });
}

function loadFormValues(form, data = {}) {
  Array.from(form.elements).forEach((node) => {
    if (!node.name) return;
    const value = getVal(data, node.name);
    if (value === "") return;
    if (node.type === "radio") {
      node.checked = node.value === value;
    } else {
      // If it's a hidden input, it's one we generated, we don't want to overwrite it with an empty value
      node.value = node.type === "hidden" ? node.value : value;
    }
  });
}

function extractKey(flatKey) {
  // This extracts "foobar[0]" into ["foobar[0]", "foobar", "0"]
  return flatKey.match(/([^\[]+)\[?(\d+)?\]?/);
}

function getVal(data, flatKey) {
  const keys = flatKey.split(".");
  try {
    const value = keys.reduce((item, currentKey) => {
      const [_, key, index] = extractKey(currentKey);
      return index ? item[key][index] : item[key];
    }, data);
    return value !== undefined ? value : "";
  } catch {
    // Fail silently if the item doesn't exist yet
    return "";
  }
}

function setVal(data, flatKey, val) {
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
  }, data);

  // Set the value on the item
  const [_, key, index] = extractKey(property);
  if (index) {
    if (!(key in target)) target[key] = [];
    target[key][index] = val;
  } else {
    target[key] = val;
  }
}

function delVal(data, flatKey) {
  // Delete a nested value from a flat key
  const keys = flatKey.split(".");
  let item = data;
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

function toggleDeclarationValidatedBar(isVisible, isDraft) {
  document.getElementById("declaration-validated-bar").hidden = !isVisible
  document.getElementById("declaration-readonly").hidden = isDraft
  document.getElementById("declaration-draft").hidden = !isDraft
}

async function setDraftStatus() {
  if (confirm("Vous allez modifier une déclaration déjà validée et transmise.")) {
    toggleDeclarationValidatedBar(true, true)
    // TODO: uncomment this once the API allows it
    //app.data.déclaration.statut = "brouillon"
    // TODO: remove this line
    app.isDraft = true
    await app.save()
    // Apply status change refreshing the page
    location.pathname = location.pathname
  }
}
