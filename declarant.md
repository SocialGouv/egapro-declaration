---
layout: tunnel
title: "Identification du déclarant pour tout contact ultérieur"
---
<h1>{{ page.title }}</h1>

<fieldset>
  <!-- fieldset display flex can't work in Chromium -->
  <div class=row>
    <div>{% include input.html name="declarant.nom" label="Nom" required=true %}</div>
    <div>{% include input.html name="declarant.prenom" label="Prénom" required=true %}</div>
  </div>
</fieldset>

<fieldset>
  {% include input.html name="declarant.tel" label="Téléphone professionel (10 chiffres)" %}
</fieldset>

<fieldset>
  <p>Adresse de l'entreprise déclarante ou siège de l'UES</p>
  <div class=row id="departement-selector">
    <div>{% include select.html name="entreprise.region" label="Région" required=true %}</div>
    <div>{% include select.html name="entreprise.departement" label="Département" required=true %}</div>
  </div>

  <div class=row>
    {% include input.html name="entreprise.adresse" label="Adresse" required=true %}
  </div>

  <div class=row>
    {% include input.html name="entreprise.codePostal" label="Code postal (5 car.)" required=true regex="\d[\dab]\d{3}" %}
    {% include input.html name="entreprise.commune" label="Commune" required=true %}
  </div>
</fieldset>

<script>
  const regionSelect = selectField('entreprise.region')
  regionSelect.addEventListener('change', loadDepartments)
  const departmentSelect = selectField('entreprise.departement')

  document.onready = async () => {
    if(!window.app.regions) {
      const response = await fetch('/datasets/regions.json')
      window.app.regions = await response.json()
    }
    dataLoaded()
  }

  function dataLoaded() {
    const regionsData = Object.keys(window.app.regions).map(region => ({label: region, value: region}))
    buildSelectOptions(regionSelect, regionsData, window.data['entreprise.region'])

    if(window.data['entreprise.region']) loadDepartments()
  }

  function loadDepartments() {
    const region = regionSelect.value
    const departments = window.app.regions[region].map(r => ({ label: r, value: r }))
    buildSelectOptions(departmentSelect, departments, window.data['entreprise.departement'])
  }

</script>
