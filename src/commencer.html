---
layout: tunnel
title: "Commencer la déclaration"
---
<h1>{{ page.title }}</h1>
  <div>
    {% include select.html name="declaration.annee" label="Année de déclaration" required=true %}
  </div>
  <div>
    {% include input.html type="regex" name="entreprise.siren" label="Numéro SIREN" required="true" pattern="[0-9]{9}" placeholder="9 chiffres" value="123456789" %}
  </div>

<script>
  document.onready = function() {
    const year = (new Date()).getFullYear()
    buildSelectOptions(
      selectField('declaration.annee'),
      [{ value: year-1, label: year-1 }, { value: year, label: year }],
      null
    )

    document.querySelector('button[rel=next]').disabled = !localStorage.token
    window.validateForm = async function(form) {
      if(localStorage.token) return true
    }
  }

  document.onsend = async function(data) {
    localStorage.annee = data['declaration.annee']
    localStorage.siren = data['entreprise.siren']

    const response = await request('GET', `/declaration/${localStorage.siren}/${localStorage.annee}`)
    if(response.ok) window.app.data = JSON.stringify(response.data.data)
  }
</script>
