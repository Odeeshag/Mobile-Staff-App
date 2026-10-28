/// <reference types="cypress" />

describe('Staff LMS - Follow Ups Page', () => {

    beforeEach(() => {

        cy.intercept('GET', '**/api/*followUp*').as('getfollowUp');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');

        cy.visit('http://54.255.136.172/#/followUp');

    });

    describe('UI Rendering & Initialization', () => {
        it('should navigate to the page and display the correct title', () => {
            cy.url().should('include', 'followUp');
            cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Follow Ups\s*$/i).should('be.visible');
        });

        it('should display all dropdown filters with the default value "All"', () => {
            const filters = [
                'G DEPARTMENT',
                'DEPARTMENT',
                'COLLECTION UNIT',
                'COLLECTION TL',
                'COLLECTION'
            ];

            filters.forEach((filterName) => {
                cy.contains('label, p, span', new RegExp('^\\s*' + filterName + '\\s*$', 'i'))
                    .parent()
                    .contains('All')
                    .should('be.visible');
            });
        });

        it('should render all quick filter priority chips', () => {
            const chips = ['All', 'Critical Priority', 'Major Priority', 'Minor Priority'];
            chips.forEach((chip) => {
                cy.contains('.MuiChip-label, button, span', new RegExp(`^\\s*${chip}\\s*$`, 'i'))
                    .should('be.visible');
            });
        });

        it('should render the search input, clear button, and global action button', () => {
            cy.get('input[placeholder*="Search customer or contract no."]').should('be.visible');
            cy.contains('button', /Clear/i).should('be.visible');
            cy.contains('button, a', /Assign priorities to contracts/i).should('be.visible');
        });

        it('should render the data table with all expected columns', () => {
            const columns = [
                'Contract No',
                'Customer',
                'Phone',
                'Currency',
                'Contract type',
                'Priority',
                'Case Reason',
                'Collection'
            ];

            columns.forEach((col) => {
                cy.get('thead th')
                    .contains(new RegExp(`^\\s*${col}\\s*$`, 'i'))
                    .scrollIntoView()
                    .should('be.visible');
            });
        });
    });

    describe('Search & Filter Functionality', () => {
        it('should allow searching by Contract No', () => {
            const testContract = '2059012';

            cy.get('input[placeholder*="Search customer or contract no."]').type(`${testContract}{enter}`);

            // FIX 1: Updated alias to match the network log tag exactly
            cy.wait('@getfollowUp');
            cy.get('tbody tr').should('have.length.greaterThan', 0);
            cy.get('tbody tr').first().should('contain.text', testContract);
        });

        it('should clear the search input and reload the full list', () => {
            cy.get('input[placeholder*="Search customer or contract no."]').type('2000988{enter}');
            cy.wait('@getfollowUp');

            cy.contains('button', /Clear/i).click();
            cy.get('input[placeholder*="Search customer or contract no."]').should('have.value', '');

            cy.wait('@getfollowUp');
            cy.get('tbody tr').should('have.length.greaterThan', 1);
        });

        it('should filter table data using MUI dropdowns', () => {
            cy.contains('label, p, span', /^\s*DEPARTMENT\s*$/i).parent().click();

            // FIX 2: Restrict selector to strictly the active listbox to avoid hidden presentation elements
            cy.get('[role="listbox"] li').eq(1).click();

            cy.wait('@getfollowUp');
            cy.get('tbody tr').should('have.length.greaterThan', 0);
        });

        it('should filter data using all Priority quick filter chips and handle empty states', () => {
            // Define the filters and their expected table values (assuming 1=Critical, 2=Major, 3=Minor)
            const filters = [
                { label: 'Critical Priority', expectedValue: '1' },
                { label: 'Major Priority', expectedValue: '2' },
                { label: 'Minor Priority', expectedValue: '3' }
            ];

            filters.forEach((filter) => {
                // Click the specific priority filter chip
                cy.contains('.MuiChip-label, button, span', new RegExp(`^\\s*${filter.label}\\s*$`, 'i')).click();

                // Wait for the backend to return the filtered data
                cy.wait('@getfollowUp');

                // Use Cypress conditional testing to check the resulting state
                cy.get('body').then(($body) => {
                    // If the application renders the empty state text anywhere on the page
                    if ($body.text().includes('No records found')) {

                        // Verify the empty state message is visible
                        cy.contains('No records found').should('be.visible');

                    } else {

                        // Verify the table contains the expected priority data
                        cy.get('tbody tr').should('have.length.greaterThan', 0);
                        cy.get('tbody tr').first().should('contain.text', filter.expectedValue);

                    }
                });
            });

            // Cleanup: Click the 'All' chip to reset the table state for any subsequent tests
            cy.contains('.MuiChip-label, button, span', /^\s*All\s*$/i).click();
            cy.wait('@getfollowUp');
        });
    });

    describe('Table Actions & Global Actions', () => {
        it('should assign priorities and show a success notification when Confirm is clicked', () => {
            // Click the global action button to open the modal
            cy.contains('button, a', /Assign priorities to contracts/i).click();

            // Assert the modal renders successfully
            cy.get('[role="dialog"]').should('be.visible');

            // Click the confirm button using your provided selector
            cy.get('.MuiDialogActions-root > .MuiButton-contained').click();

            // Verify the success toast notification appears (matches "Screenshot 2026-09-07 090524.png")
            cy.contains('Priority sync completed successfully').should('be.visible');
        });

        it('should close the modal without making changes when Cancel is clicked', () => {
            // Click the global action button to open the modal
            cy.contains('button, a', /Assign priorities to contracts/i).click();

            // Assert the modal renders successfully
            cy.get('[role="dialog"]').should('be.visible');

            // Click the cancel button using your provided selector
            cy.get('.MuiDialogActions-root > .MuiButton-text').click();

            // Assert the modal completely closes and is removed from the DOM
            cy.get('[role="dialog"]').should('not.exist');
        });

        it.skip('should trigger row-level actions (e.g., Follow up priority change)', () => {
            cy.get('tbody tr').first().within(() => {
                // Target the action button in the final column. 
                // Adjust the selector if this action is nested in an ellipsis menu
                cy.get('td').last().find('svg, button, a').first().click();
            });

            // Assert expected behavior (e.g., modal opens to edit priority)
            cy.get('[role="dialog"], .MuiDialog-paper').should('be.visible');
        });
    });

    describe('Pagination', () => {
        it('should disable the Previous button on page 1', () => {
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');
        });

        it('should navigate to the next page when Next is clicked', () => {
            // Setup dynamic intercept for pagination if the API appends parameters
            cy.intercept('GET', '**/api/*follow*page=2*').as('getNextPage');

            cy.contains('button', /Next/i).click();

            // Remove wait if pagination is handled client-side
            cy.wait('@getNextPage');

            cy.contains(/Page 2 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('not.be.disabled');
        });
    });
});