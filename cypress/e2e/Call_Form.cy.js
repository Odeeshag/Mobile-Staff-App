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

    // Helper: build a future date string (tomorrow) in YYYY-MM-DD
    const getFutureDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 7); // 7 days from now to avoid edge cases
        return d.toISOString().slice(0, 10);
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

    it('should display all 6 sections in the Call Form sidebar and as accordion cards', () => {
        openCallForm();

        // The section keys rendered via wu map: customer, guarantor, car, litigation, village_master, agent
        // Displayed as accordion card titles (subtitle1 text) and in the left sidebar on large viewports
        const sections = [
            'Customer call',
            'Guarantor call',
            'Car collateral check',
            'Litigation',
            'Village master check',
            'Agent contact check',
        ];

        sections.forEach((section) => {
            cy.contains(section).should('exist');
        });
    });

    it('should fill Section 1 - Customer call with Answered status and YES willing to pay, then save draft', () => {
        openCallForm();

        // Intercept the save draft API call
        cy.intercept('POST', '**/api/callDraft/section').as('saveDraft');

        // Open Customer call section (accordion) - click to expand if collapsed
        cy.contains('[id^="section-customer"] *', /Customer call/i)
            .first()
            .then(($el) => {
                const $card = $el.closest('[id^="section-customer"]');
                if ($card.length) {
                    cy.wrap($card).find('[aria-label="Customer call"]').then(($btn) => {
                        if ($btn.length) cy.wrap($btn).click({ force: true });
                    });
                }
            });

        // Select Call status = Answered
        cy.get('[id="field-customer.call_status"]').click();
        cy.get('[role="listbox"]:visible').contains('Answered').click();

        // Select Willing to pay = YES
        cy.get('[id="field-customer.willing_to_pay"]').click();
        cy.get('[role="listbox"]:visible').contains('YES').click();

        // Verify YES is selected
        cy.get('[id="field-customer.willing_to_pay"]').should('contain.text', 'YES');

        // Who will pay dropdown — use specific id to avoid matching guarantor section
        cy.get('[id="field-customer.who_will_pay"]').click();
        cy.get('[role="listbox"]:visible').find('li').not(':first').first().click();

        // Date field — must be a future date (server validates notPast)
        cy.get('[id="field-customer.pay_date"]').type(getFutureDate());

        // Amount field
        cy.get('[id="field-customer.pay_amount"]').clear().type('500');

        // Currency field - select USD (value 1)
        cy.get('[id="field-customer.pay_currency"]').click();
        cy.get('[role="listbox"]:visible').contains('USD').click();

        // Source of funds
        cy.get('[id="field-customer.source_of_funds"]').clear().type('Salary');

        // Comments
        cy.get('[id="field-customer.comments"]').clear().type('Customer agreed to pay.');

        // Click Save draft button scoped to the Customer call section card
        cy.get('[id="section-customer"]').within(() => {
            cy.contains('button', /Save draft/i).click();
        });

        // Wait for the API call to succeed
        cy.wait('@saveDraft').its('response.statusCode').should('eq', 200);

        // Assert section status chip changes — "Not started" should be gone
        cy.get('[id="section-customer"]').should('not.contain.text', 'Not started');
    });

    it('should show the Back button and Call history button on the Call Form page', () => {
        openCallForm();
        cy.contains('button', /Back/i).should('be.visible');
        // "Call history" button is labelled via cf_view_history = "Call history"
        cy.contains('button', /Call history/i).should('be.visible');
    });

    it('should show Cancel and Final submit buttons and section counter at the bottom', () => {
        openCallForm();
        cy.contains('button', /Cancel/i).should('be.visible');
        cy.contains('button', /Final submit/i).should('be.visible');
        // Counter uses pattern: "X / 6 sections saved"
        cy.contains(/\d+\s*\/\s*\d+\s*sections saved/i).should('be.visible');
    });

    it('should navigate back to Tasks page when Back button is clicked', () => {
        openCallForm();
        cy.contains('button', /Back/i).click();
        cy.url().should('include', '/tasks');
    });

    it('should show Call status as a required field', () => {
        openCallForm();
        // Required asterisk span should be present on the Call status label
        cy.get('[id="field-customer.call_status"]')
            .closest('.MuiFormControl-root')
            .find('label')
            .should('contain.text', '*');
    });

    it('should reveal additional fields when Willing to pay is set to YES', () => {
        openCallForm();

        cy.get('[id="field-customer.call_status"]').click();
        cy.get('[role="listbox"]:visible').contains('Answered').click();

        cy.get('[id="field-customer.willing_to_pay"]').click();
        cy.get('[role="listbox"]:visible').contains('YES').click();

        // Conditional fields rendered inside the payment details outlined box
        // Labels are: "Who will pay", "Date", "Amount", "Currency", "Source of funds", "Comments"
        cy.get('[id="field-customer.who_will_pay"]').should('be.visible');
        cy.get('[id="field-customer.pay_date"]').should('be.visible');
        cy.get('[id="field-customer.pay_amount"]').should('be.visible');
        cy.get('[id="field-customer.pay_currency"]').should('be.visible');
        cy.get('[id="field-customer.source_of_funds"]').should('be.visible');
        cy.get('[id="field-customer.comments"]').should('be.visible');
    });

    it('should display Assets section with Car, Only land, and Land + house dropdowns', () => {
        openCallForm();
        // Assets section is a subtitle2 heading inside the Customer call accordion
        cy.contains('[class*="MuiTypography-subtitle2"]', /Assets/i).should('be.visible');
        cy.get('[id="field-customer.assets.car.has_asset"]').should('exist');
        cy.get('[id="field-customer.assets.land.has_asset"]').should('exist');
        cy.get('[id="field-customer.assets.land_house.has_asset"]').should('exist');
    });

    it('should display customer info (Name, Phone, Address) in Section 1', () => {
        openCallForm();
        // Customer info is rendered as plain text fields above the form fields
        cy.contains('Name').should('be.visible');
        cy.contains('Phone').should('be.visible');
        cy.contains('Address').should('be.visible');
    });
});
