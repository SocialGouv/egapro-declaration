---
layout: tunnel
title: "Ecart de taux d'augmentations individuelles entre les femmes et les hommes"
---

<h1>{{ page.title }}</h1>

<fieldset>
  <div class=row>
    <div>{% include radios.html name='augmentation-calculable' label="L'indicateur sur les taux d'augmentations individuelles est-il calculable" required="true" %}</div>
  </div>
</fieldset>

<fieldset id="non-calculable">
  <div class=row>{% include select.html name="augmentation-precision-motif" empty="true" label="Précision du motif" %}</div>
</fieldset>

<fieldset id="autre-motif">
  <div class=row>{% include textarea.html name="augmentation-precision-autre-motif" label='Préciser "autres motifs"' %}</div>
</fieldset>

<fieldset>
  <div class=row>{% include input.html type="number" name="augmentation-resultat-pourcentage" label="Résultat final en pourcentage (%)" min=0 max=40 %}</div>
</fieldset>

<fieldset>
  <div class=row>{% include input.html type="number" name="augmentation-resultat-nombre-salaries" label="Résultat final en nombre de salariés" min=0 max=40 %}</div>
</fieldset>

<fieldset>
  <div class=row>{% include select.html name="augmentation-favorable" empty="true" label="Population envers laquelle l'écart est favorable" %}</div>
</fieldset>

<fieldset class="note subnote">
  <div class=row>{% include input.html type="number" name="augmentation-resultat-pourcentage" label="Nombre de points obtenus sur le résultat final en pourcentage" min=0 max=40 %}</div>
</fieldset>

<fieldset class="note subnote">
  <div class=row>{% include input.html type="number" name="augmentation-resultat-nombre-salaries" label="Nombre de points obtenus sur le résultat final en nombre de salariés" min=0 max=40 %}</div>
</fieldset>

<fieldset class=note>
  <div class=row>{% include input.html type="number" name="remuneration-note" label="Nombre de points obtenus sur l'indicateur" min=0 max=35 %}</div>
</fieldset>

<script>
  document.onready = () => {
    const calculOptions = [
      {value: "calculable", label: "oui"},
      {value: "nc", label: "non"},
    ]
    buildRadioOptions(selectField('augmentation-calculable'), calculOptions, "calculable")
    const motifsOptions = [
      { value: 'asbaugi', label: "Absence d'augmentations individuelles"},
      { value: 'xxxxxx', label: "L'entreprise ne comporte pas au moins 5 femmes et 5 hommes"},
      { value: 'autre', label: "Autres motifs"},
    ]
    buildSelectOptions(selectField('augmentation-precision-motif'), motifsOptions)
    const favorableOptions = [
      { value: 'femmes', label: "Femmes" },
      { value: 'hommes', label: "Hommes" }
    ]
    buildSelectOptions(selectField('augmentation-favorable'), favorableOptions)

    const checkCalculable = (calculableSelector, motifSelector, precisionAutreSelector) => {
      const nonCalculableMotifFieldset = document.querySelector(motifSelector)
      const nonCalculableMotif = document.querySelector(`${motifSelector} select`)

      const nonCalculableAutreFieldset = document.querySelector(precisionAutreSelector)

      const isCalculable = !document.querySelector(calculableSelector).checked

      // The "précision du motif" select should only be enabled if the indicator isn't computable
      nonCalculableMotifFieldset.disabled = isCalculable
      // The "préciser autre motif" textarea should only be enabled if the indicator isn't computable and the "motif" is "autre"
      nonCalculableAutreFieldset.disabled = isCalculable || nonCalculableMotif.value != 'autre'
    }

    checkCalculable('[value="nc"]', '#non-calculable', '#autre-motif')

    Array.from(document.querySelectorAll('[name=augmentation-calculable]')).forEach(function(radio) {
      radio.addEventListener('change', function(event) {
        checkCalculable('[value="nc"]', '#non-calculable', '#autre-motif')
      })
    })

    // Only enable the "préciser autre motif" textarea if the "motif" is "autre"
    document.querySelector('[name=augmentation-precision-motif]').addEventListener('change', function(event) {
      checkCalculable('[value="nc"]', '#non-calculable', '#autre-motif')
    })
  }
</script>
