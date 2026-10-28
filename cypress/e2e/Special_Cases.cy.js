/// <reference types="cypress" />

describe('Staff LMS - Special Cases Page', () => {

    beforeEach(() => {
        // FIX 1: Intercept path changed to singular 'case' to match the actual network request
        cy.intercept('GET', '**/api/*special-case*').as('getSpecialCases');
        cy.intercept('PUT', '**/api/*special-case*').as('updateCase');
        cy.login('eranda.h@lalco.la', 'Eranda.h@1');
        cy.visit('http://54.255.136.172/#/special-cases');
    });

    describe('UI Rendering & Initialization', () => {
        it('should render the page title, search bar, dropdown, and table headers', () => {
            cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Special Cases\s*$/i).should('be.visible');

            // FIX 2: Used case-insensitive regex to bypass CSS text-transform issues
            cy.contains(/CASE TYPE/i).should('be.visible');
            cy.contains('All').should('be.visible');

            cy.get('input[placeholder*="Search by contract number"]').should('be.visible');

            const columns = [
                'ID', 'Contract No', 'Customer', 'Case status', 'Visited to',
                'Met who', 'Visit Result', 'GPS repaired?', 'Visited at',
                'Notes', 'Created', 'Actions'
            ];

            columns.forEach((col) => {
                cy.get('thead th')
                    .contains(col, { matchCase: false })
                    .should('exist');
            });
        });
    });

    describe('Search & Filtering Functionality', () => {
        it('should filter the table using the Case Type dropdown', () => {
            // FIX 2: Applied regex for 'CASE TYPE'
            cy.contains(/CASE TYPE/i).parent().click();

            cy.get('[role="listbox"]').should('be.visible').within(() => {
                cy.contains('li', 'Mafia').should('be.visible');
                cy.contains('li', 'Third party').should('be.visible');
                cy.contains('li', 'Car broken').should('be.visible');
                cy.contains('li', 'Customer arrested / passed away').should('be.visible');
                cy.contains('li', 'Seized by police').should('be.visible');
                cy.contains('li', 'GPS offline').should('be.visible');

                cy.contains('li', 'Car broken').click();
            });

            cy.wait('@getSpecialCases');
            cy.get('tbody tr').first().find('td').eq(3).should('contain.text', 'Car broken');
        });

        it('should filter the table when searching by Contract Number', () => {
            const searchInput = 'input[placeholder*="Search by contract number"]';
            const testContractNo = '2000988';

            cy.get(searchInput).clear().type(`${testContractNo}{enter}`);
            cy.wait('@getSpecialCases');

            cy.get('tbody tr').should('have.length.greaterThan', 0);
            cy.get('tbody tr').first().find('td').eq(1).should('contain.text', testContractNo);
        });
    });

    describe('Row-Level Actions - Edit Modal', () => {
        it('should open the Update case modal, fill the form, and submit', () => {
            // FIX 1: Update intercept to match the exact POST request shown in the log
            cy.intercept('POST', '**/api/update-special-case-legal-status*').as('updateCase');

            cy.get('tbody tr').first().within(() => {
                cy.get('td').last().find('button').eq(1).click();
            });

            cy.get('[role="dialog"]').should('be.visible').within(() => {
                cy.contains('h2, div, p', /^\s*Update case\s*$/i).should('be.visible');
                cy.contains('Status *').should('be.visible');
                cy.contains(/Notes/i).should('be.visible');

                // Open the dropdown
                cy.contains('Status *').parent().click();
            });

            cy.get('[role="listbox"]').should('be.visible').find('li').last().click();

            cy.get('[role="dialog"]').within(() => {
                cy.contains(/Notes/i).parent().find('textarea, input').first().type('Cypress automated case update');
                cy.contains('button', 'Update case').click();
            });

            // FIX 2: Explicitly wait for the POST request to finish before checking the UI
            cy.wait('@updateCase');

            cy.get('[role="dialog"]').should('not.exist');

            // FIX 3: Simplified the regex to easily catch the success toast
            cy.contains(/success/i).should('be.visible');
        });
    });

    describe('Pagination', () => {
        it('should disable the Previous button on the first page', () => {
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.visible').and('be.disabled');
            cy.contains('button', /Next/i).should('be.visible').and('not.be.disabled');
        });


        it('should navigate to the next page and back to the previous page', () => {
            // FIX 4: Wait for the initial table load to finish
            cy.wait('@getSpecialCases');
            cy.get('tbody tr').should('have.length.greaterThan', 0);

            // FIX 5: Hard wait to allow trailing React background effects to settle.
            // This prevents the app from firing a late 'page=1' request that overwrites our click.
            cy.wait(1000);

            // Verify initial state
            cy.contains(/Page 1 of/i).should('be.visible');

            // Click Next
            cy.contains('button', /Next/i).click();
            cy.wait('@getSpecialCases');

            // Verify Page 2
            cy.contains(/Page 2 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('not.be.disabled');

            // Click Previous
            cy.contains('button', /Previous/i).click();
            cy.wait('@getSpecialCases');

            // Verify return to Page 1
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');
        });
    });
});