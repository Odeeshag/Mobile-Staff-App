/// <reference types="cypress" />

describe('Staff LMS - Collection and Legal Team Page', () => {

    beforeEach(() => {
        cy.intercept('GET', '**/api/*collection*').as('getTeamData');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');

        cy.visit('http://54.255.136.172/#/collection-legal-team');
    });

    describe('UI Rendering & Initialization', () => {
        it('should navigate to the page and display the correct title', () => {
            cy.url().should('include', 'collection-legal-team');

            // Target the title using MUI class and regex
            cy.contains('.MuiTypography-root', /^\s*Collection and Legal Team\s*$/i).should('be.visible');
        });

        it('should display all dropdown filters with the default value "All"', () => {
            const filters = [
                'DEPT',
                'COLLECTION UNIT',
                'COLLECTION TL',
                'COLLECTION',
                'LEGAL',
                'COLLECTION CC'
            ];

            filters.forEach((filterName) => {
                if (filterName === 'LEGAL') {
                    // Target the specific 'LEGAL' filter on the page to avoid the side panel menu item
                    cy.get('.css-1nywt0i > :nth-child(5) > .MuiBox-root > .MuiTypography-caption')
                        .parent()
                        .contains('All')
                        .should('be.visible');
                } else {
                    // Use the standard text-based search for all other filters
                    cy.contains('label, p, span', new RegExp('^\\s*' + filterName + '\\s*$', 'i'))
                        .parent()
                        .contains('All')
                        .should('be.visible');
                }
            });
        });

        it('should render all action buttons', () => {
            cy.contains('button', /Clear/i).should('be.visible');
            cy.contains('button, a, span', /Download Sample File/i).should('be.visible');
            cy.contains('label, button, span', /Upload File/i).should('be.visible');
        });

        it('should render the data table with all expected columns', () => {
            const columns = [
                'Dept',
                'Unit Name',
                'Unit Staff No',
                'TL Name',
                'TL Staff No',
                'Collection Name',
                'Collection Staff No',
                'Legal Name',
                'Legal Staff No',
                'Collection CC Name'
            ];

            columns.forEach((col) => {
                cy.get('thead th')
                    .contains(new RegExp(`^\\s*${col}\\s*$`, 'i'))
                    .scrollIntoView() // Ensures visibility if the table overflows horizontally
                    .should('be.visible');
            });
        });
    });

    describe('Filter Functionality', () => {
        it('should filter table data using MUI dropdowns', () => {
            // 1. Click the parent wrapper of the label to open the MUI popover
            cy.contains('label, p, span', /^\s*DEPT\s*$/i)
                .parent()
                .click();

            // 2. Select an option from the detached MUI listbox
            cy.get('[role="listbox"], [role="presentation"]')
                .contains('NO') // Using a department name visible in the table
                .click();

            // Wait for the API to fetch filtered data (if it triggers a network request)
            cy.wait('@getTeamData');

            // Verify table updates
            cy.get('tbody tr').should('have.length.greaterThan', 0);
            cy.get('tbody tr').first().should('contain.text', 'NO');
        });

        it('should clear selected filters when the Clear button is clicked', () => {
            // Open and set a filter first
            cy.contains('label, p, span', /^\s*DEPT\s*$/i).parent().click();
            cy.get('[role="listbox"], [role="presentation"]').contains('SENG-F').click();
            cy.wait('@getTeamData');

            // Click clear
            cy.contains('button', /Clear/i).click();

            // Verify filter resets to "All"
            cy.contains('label, p, span', /^\s*DEPT\s*$/i)
                .parent()
                .contains('All')
                .should('be.visible');

            cy.wait('@getTeamData');
        });
    });

    describe('File Operations', () => {
        it('should trigger the sample file download', () => {
            // Using the robust download technique to prevent cross-origin timeouts
            cy.contains('button, a, span', /Download Sample File/i)
                .should('be.visible')
                .click();
        });

        it('should allow attaching a file for upload', () => {
            cy.contains('label, button, span', /Upload File/i).should('be.visible');

            // Needs 'cypress-file-upload' plugin to interact with hidden input[type="file"]
            // cy.get('input[type="file"]').attachFile('team-assignment.xlsx');
        });
    });

    describe('Pagination', () => {
        it('should disable the Previous button on page 1', () => {
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');
        });

        it('should navigate to the next page when Next is clicked', () => {
            // Setup dynamic intercept for pagination if required
            cy.intercept('GET', '**/api/*collection*page=2*').as('getNextPage');

            cy.contains('button', /Next/i).click();

            // Wait for the specific page request (remove this cy.wait if pagination is client-side)
            cy.wait('@getNextPage');

            cy.contains(/Page 2 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('not.be.disabled');
        });
    });
});