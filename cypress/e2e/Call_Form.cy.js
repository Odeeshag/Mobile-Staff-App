/// <reference types="cypress" />

describe('Staff LMS - Open Call Form', () => {

    // Helper: scroll table right and click "Open call form" on the first row
    const openCallForm = () => {
        cy.get('table').parent().scrollTo('right', { ensureScrollable: false });
        cy.get('tbody tr').first().find('td').last().within(() => {
            cy.get('a[aria-label="Open call form"]').click();
        });
        cy.url().should('include', '/call-form/');
    };

    beforeEach(() => {
        cy.login('eranda.h@lalco.la', 'Eranda.h@1');
        cy.visit('http://54.255.136.172/#/tasks');
        cy.get('tbody tr').should('have.length.greaterThan', 0);
    });

    it('should navigate to the Call Form page from the Tasks table', () => {
        openCallForm();
        cy.contains('h5', 'Customer call').should('be.visible');
    });

    it('should display all 7 sections in the Call Form', () => {
        openCallForm();

        const sections = [
            '1. Customer call',
            '2. Guarantor call',
            '3. Car collateral check',
            '4–5. Litigation',
            '6. Village master check',
            '7. Agent contact check',
        ];

        sections.forEach((section) => {
            cy.contains(section).should('exist');
        });
    });

    it('should fill Section 1 - Customer call with Answered status and YES willing to pay, then save draft', () => {
        openCallForm();

        // Select Call status = Answered
        cy.get('[id="field-customer.call_status"]').click();
        cy.get('[role="listbox"]:visible').contains('Answered').click();

        // Select Willing to pay = YES
        cy.get('[id="field-customer.willing_to_pay"]').click();
        cy.get('[role="listbox"]:visible').contains('YES').click();

        // Verify YES is selected
        cy.get('[id="field-customer.willing_to_pay"]').should('contain.text', 'YES');

        // Who will pay dropdown — pick first non-placeholder option
        cy.get('[id*="who_will_pay"]').click();
        cy.get('[role="listbox"]:visible').find('li').not(':first').first().click();

        // Date field
        cy.get('input[type="date"]').first().type('2025-01-15');

        // $ Amount
        cy.get('input[type="number"]').first().clear().type('500');

        // Source of funds
        cy.get('input[id*="source"]').first().clear().type('Salary');

        // Comments
        cy.get('textarea').first().clear().type('Customer agreed to pay on the 15th.');

        // Save draft for Section 1
        cy.contains('button', /Save draft/i).first().click();

        // Assert section status changes from "Not started"
        cy.contains('1. Customer call')
            .closest('[class*="MuiListItemButton"]')
            .should('not.contain.text', 'Not started');
    });

    it('should show the Back button and Call history button on the Call Form page', () => {
        openCallForm();
        cy.contains('button', /Back/i).should('be.visible');
        cy.contains('button', /Call history/i).should('be.visible');
    });

    it('should show Cancel and Final submit buttons and section counter at the bottom', () => {
        openCallForm();
        cy.contains('button', /Cancel/i).should('be.visible');
        cy.contains('button', /Final submit/i).should('be.visible');
        cy.contains(/0 \/ 6 sections saved/i).should('be.visible');
    });

    it('should navigate back to Tasks page when Back button is clicked', () => {
        openCallForm();
        cy.contains('button', /Back/i).click();
        cy.url().should('include', '/tasks');
    });

    it('should show Call status as a required field', () => {
        openCallForm();
        // Required asterisk span should be present on the Call status label
        cy.contains('label', /Call status/i).find('span').should('exist');
    });

    it('should reveal additional fields when Willing to pay is set to YES', () => {
        openCallForm();

        cy.get('[id="field-customer.call_status"]').click();
        cy.get('[role="listbox"]:visible').contains('Answered').click();

        cy.get('[id="field-customer.willing_to_pay"]').click();
        cy.get('[role="listbox"]:visible').contains('YES').click();

        // Conditional fields should appear
        cy.contains('label', /Who will pay/i).should('be.visible');
        cy.contains('label', /Date/i).should('be.visible');
        cy.contains('label', /\$ Amount/i).should('be.visible');
        cy.contains('label', /Source of funds/i).should('be.visible');
        cy.contains('label', /Comments/i).should('be.visible');
    });

    it('should display Assets section with Car, Only land, and Land + house dropdowns', () => {
        openCallForm();
        cy.contains('h6', 'Assets').should('be.visible');
        cy.contains('label', /Car \(outside contract\)/i).should('be.visible');
        cy.contains('label', /Only land/i).should('be.visible');
        cy.contains('label', /Land \+ house/i).should('be.visible');
    });

    it('should display customer info (Name, Phone, Address) in Section 1', () => {
        openCallForm();
        cy.contains('Name').should('be.visible');
        cy.contains('Phone').should('be.visible');
        cy.contains('Address').should('be.visible');
    });
});
