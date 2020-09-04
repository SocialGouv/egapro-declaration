---
layout: tunnel
title: "Ecart de rémunération entre les femmes et les hommes par catégorie socioprofessionnelle"
---

<hgroup>
  <h1>{{ page.title }}</h1>
  <h3>Il faut saisir les écarts de rémunération en % avant application du seuil de pertinence</h3>
</hgroup>

<table>
  <thead>
    <tr>
      <th></th>
      <th>Moins de 30 ans</th>
      <th>De 30 à 39 ans</th>
      <th>De 40 à 49 ans</th>
      <th>50 ans et plus</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <th>Ouvriers (en %)</th>
      <td>
        {% include input.html type="number" name='ouvriers-moins-de-30' min=0 required=true %}
      </td>
      <td>
        {% include input.html type="number" name='ouvriers-de-30-a-39' min=0 required=true %}
      </td>
      <td>
        {% include input.html type="number" name='ouvriers-de-40-a-49' min=0 required=true %}
      </td>
      <td>
        {% include input.html type="number" name='ouvriers-50-et-plus' min=0 required=true %}
      </td>
    </tr>
    <tr>
      <th>Employés (en %)</th>
      <td>
        {% include input.html type="number" name='employes-moins-de-30' min=0 required=true %}
      </td>
      <td>
        {% include input.html type="number" name='employes-de-30-a-39' min=0 required=true %}
      </td>
      <td>
        {% include input.html type="number" name='employes-de-40-a-49' min=0 required=true %}
      </td>
      <td>
        {% include input.html type="number" name='employes-50-et-plus' min=0 required=true %}
      </td>
    </tr>
    <tr>
      <th>Techniciens et agents de maîtrise (en %)</th>
      <td>
        {% include input.html type="number" name='tam-moins-de-30' min=0 required=true %}
      </td>
      <td>
        {% include input.html type="number" name='tam-de-30-a-39' min=0 required=true %}
      </td>
      <td>
        {% include input.html type="number" name='tam-de-40-a-49' min=0 required=true %}
      </td>
      <td>
        {% include input.html type="number" name='tam-50-et-plus' min=0 required=true %}
      </td>
    </tr>
    <tr>
      <th>Ingénieurs et cadres (en %)</th>
      <td>
        {% include input.html type="number" name='ic-moins-de-30' min=0 required=true %}
      </td>
      <td>
        {% include input.html type="number" name='ic-de-30-a-39' min=0 required=true %}
      </td>
      <td>
        {% include input.html type="number" name='ic-de-40-a-49' min=0 required=true %}
      </td>
      <td>
        {% include input.html type="number" name='ic-50-et-plus' min=0 required=true %}
      </td>
    </tr>
  </tbody>
</table>