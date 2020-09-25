---
layout: tunnel
title: "Vous êtes une entreprise"
---
<h1>{{ page.title }}</h1>

<fieldset>
  <div class=row>
    <div>{% include input.html name='entreprise.nom' label='Raison Sociale' required=true %}</div>
  </div>
</fieldset>

<fieldset>
  <div class=row>
    <div>{% include select.html name='entreprise.naf' label='Code NAF' required=true %}</div>
  </div>
</fieldset>

<script>
  document.onready = function() {
    const select = selectField('entreprise.naf')
    const options = [{ value: '1', label: 'Yes' }]
    buildSelectOptions(select, options)
  }
</script>
