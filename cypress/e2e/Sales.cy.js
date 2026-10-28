/// <reference types="cypress" />

describe('Staff LMS - Sales Page', () => {

    beforeEach(() => {
        cy.intercept('GET', '**/api/*sales*').as('getSales');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');

        cy.visit('http://54.255.136.172/#/sales');
    });

    describe('UI Rendering & Initialization', () => {
        it('should navigate to the page and display the correct title', () => {
            cy.url().should('include', '/sales');

            // Verify page title is active in the header or sidebar (adjust selector if it's a page header)
            cy.contains('.MuiTypography-root, h1, h2, h3, .MuiListItem-root', /^\s*Sales\s*$/i).should('be.visible');
        });

        it('should display all dropdown filters with the default value "All"', () => {
            const filters = [
                'G DEPARTMENT',
                'DEPARTMENT',
                'BRANCH',
                'UNIT',
                'MINI UNIT'
            ];

            filters.forEach((filterName) => {
                cy.contains('label, p, span', new RegExp(`^\\s*${filterName}\\s*$`, 'i'))
                    .parent()
                    .contains('All')
                    .should('be.visible');
            });
        });

        it('should render the search input and clear button', () => {
            cy.get('input[placeholder*="Search sales by contract number"]').should('be.visible');
            cy.contains('button', /Clear/i).should('be.visible');
        });

        it.skip('should render the data table with all expected columns', () => {
            const columns = [
                'ID',
                'Contract No',
                'Customer Name',
                'Phone',
                'Loan Amount',
                'Department',
                'Contract Date',
                'Actions'
            ];

            columns.forEach((col) => {
                cy.get('thead th')
                    .contains(new RegExp(`^\\s*${col}\\s*$`, 'i')).should('be.visible');
            });
        });
    });

    describe('Search & Filter Functionality', () => {
        it('should allow searching by Contract No', () => {
            // Type a known contract number from the table and trigger the search
            const testContract = '2022049';
            cy.get('input[placeholder*="Search sales by contract number"]').type(`${testContract}{enter}`);

            // If the app requires clicking a search icon instead of {enter}, uncomment below:
            // cy.get('input[placeholder*="Search sales by contract number"]').parent().find('svg, button').click();

            // Wait for the API to return the filtered results
            cy.wait('@getSales');

            // Verify the table filtered correctly
            cy.get('tbody tr').should('have.length.greaterThan', 0);
            cy.get('tbody tr').first().should('contain.text', testContract);
        });

        it('should clear the search input and reload the full list', () => {
            const testContract = '2027231';
            cy.get('input[placeholder*="Search sales by contract number"]').type(`${testContract}{enter}`);
            cy.wait('@getSales');

            cy.contains('button', /Clear/i).click();

            // Verify the input is cleared
            cy.get('input[placeholder*="Search sales by contract number"]').should('have.value', '');

            cy.wait('@getSales');
            cy.get('tbody tr').should('have.length.greaterThan', 1);
        });

        it('should filter table data using MUI dropdowns', () => {
            // Open the Department filter dropdown
            cy.contains('label, p, span', /^\s*DEPARTMENT\s*$/i).parent().click();

            // Select a specific department from the list (e.g., LING-F)
            cy.get('[role="listbox"], [role="presentation"]')
                .contains('LING-F')
                .click();

            cy.wait('@getSales');

            // Verify that the table rows reflect the filtered department
            cy.get('tbody tr').first().should('contain.text', 'LING-F');
        });
    });

    describe('Table Data & Actions', () => {
        it('should trigger the view action when the eye icon is clicked', () => {
            cy.get('tbody tr').first().within(() => {
                // Extract the Contract No (2nd column, index 1) for verification
                cy.get('td').eq(1).invoke('text').then((text) => {
                    cy.wrap(text.trim()).as('rowContractNo');
                });

                // Click the action (eye) icon in the last column
                cy.get('td').last().find('svg, button, a').first().click();
            });

            // Verify the resulting action (Modal opens OR navigates to a detailed view)
            cy.get('[role="dialog"]').should('be.visible').within(() => {
                // Verify the modal title
                cy.contains('Contract Details').should('be.visible');

                // Verify the correct contract number was passed to the modal
                cy.get('@rowContractNo').then((contractNo) => {
                    cy.contains(contractNo).should('be.visible');
                });
            });


        });
    });

    describe('Pagination', () => {
        it('should disable the Previous button on page 1', () => {
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');
        });

        it('should navigate to the next page when Next is clicked', () => {
            // Setup dynamic intercept for pagination if the API appends `?page=2`
            cy.intercept('GET', '**/api/*sales*page=2*').as('getNextPage');

            cy.contains('button', /Next/i).click();

            // Remove cy.wait() if the table paginates locally without an API call
            cy.wait('@getNextPage');

            cy.contains(/Page 2 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('not.be.disabled');
        });
    });
});