describe("Visiting the home page", () => {
  it('starts the "new declaration" process', () => {
    // Given
    cy.visit("/");

    // Then
    cy.url().should("include", "presentation.html");

    // When
    cy.contains("Suivant").click();

    // Then
    cy.url().should("include", "confidentialite.html");

    // When
    cy.contains("Suivant").click();

    // Then
    cy.url().should("include", "email.html");

    // When
    cy.get("[name=email]").type("foo@bar.com");
    cy.contains("Valider mon email").click();

    // Then
    cy.url().should("include", "validation-email.html");
  });
});

describe('Visiting a "tunnel" page without a token', () => {
  it("redirects to the home page", () => {
    // Given
    cy.visit("/commencer.html");

    // Then
    cy.url().should("include", "presentation.html");
  });
});

describe("Visiting the home page with the siren and year urlparams", () => {
  it("redirects to the email page", () => {
    // Given
    cy.visit("/?year=2021&siren=123456790");

    // Then
    cy.url()
      .should("include", "email.html")
      .then(() => {
        expect(localStorage.getItem("data")).to.eq(
          '{"source":"formulaire","déclaration":{"année_indicateurs":2021},"entreprise":{"siren":"123456790"}}'
        );
      });
  });
});
