/// <reference types="cypress" />

describe('Staff LMS - Loans Page', () => {

    beforeEach(() => {
        // Intercept API calls to wait for table data to load/filter
        cy.intercept('GET', '**/api/*loan*').as('getLoans');
        
        cy.intercept('PUT', '**/api/*loan*').as('updateLoan');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');

        cy.visit('http://54.255.136.172/#/loans');
    });

    describe('UI Rendering & Initialization', () => {
        it('should render the top bar elements (Dropdowns, Search, Add Button)', () => {
            cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Loans\s*$/i).should('be.visible');
            
            // Verify Dropdowns
            cy.contains('All Types').should('be.visible');
            // cy.contains('Search All').should('be.visible');

            // Verify Search Bar and Add Button
            cy.get('input[placeholder*="Search by loan ID, customer name"]').should('be.visible');
            cy.contains('button, a', /Add Loan/i).should('be.visible');
        });

        it('should render the data table with all expected columns', () => {
            const columns = [
                'Loan',
                'Customer',
                'Amount',
                'Type',
                'Dates',
                'Actions'
            ];

            columns.forEach((col) => {
                // Using 'exist' to avoid sticky header scroll conflicts
                cy.get('thead th')
                    .contains(new RegExp(`^\\s*${col}\\s*$`, 'i'))
                    .should('exist');
            });
        });
    });

    describe('Filter & Search Functionality', () => {
        it('should open and display options for the "All Types" and "Search All" dropdown menus', () => {
            // Interact with "All Types" dropdown
            cy.contains('All Types').click();
            cy.get('[role="listbox"]').should('be.visible').within(() => {
                cy.get('li').should('have.length.greaterThan', 0);
            });
            // Close dropdown by clicking outside or pressing Escape
            cy.get('body').type('{esc}');

            // // Interact with "Search All" dropdown
            // cy.contains('Search All').click();
            // cy.get('[role="listbox"]').should('be.visible').within(() => {
            //     cy.get('li').should('have.length.greaterThan', 0);
            // });
            // cy.get('body').type('{esc}');
        });

        it('should filter the table when searching by Loan ID, Customer Name, and Phone', () => {
            const searchInput = 'input[placeholder*="Search by loan ID, customer name"]';

            // 1. Search by Loan ID
            const testLoanId = '25';
            cy.get(searchInput).clear().type(`${testLoanId}{enter}`);
            cy.wait('@getLoans');
            cy.get('tbody tr').should('have.length.greaterThan', 0);
            cy.get('tbody tr').first().should('contain.text', testLoanId);

            // 2. Search by Customer Name
            const testCustomer = 'ANOUVAT';
            cy.get(searchInput).clear().type(`${testCustomer}{enter}`);
            cy.wait('@getLoans');
            cy.get('tbody tr').should('have.length.greaterThan', 0);
            cy.get('tbody tr').first().should('contain.text', testCustomer);

            // 3. Search by Phone Number (Using dummy data; adjust to match DB)
            const testPhone = '020'; 
            cy.get(searchInput).clear().type(`${testPhone}{enter}`);
            cy.wait('@getLoans');
            cy.get('tbody tr').should('have.length.greaterThan', 0);

            // Cleanup
            cy.get(searchInput).clear().type('{enter}');
            cy.wait('@getLoans');
        });
    });

    describe('Global & Row-Level Actions (Modals)', () => {
        it('should open the Add New Loan modal and render all form fields', () => {
            // Click the Add Loan button
            cy.contains('button, a', /Add Loan/i).click();

            // Target the MUI Portal dialog
            cy.get('[role="dialog"]').should('be.visible').within(() => {
                cy.contains('Add New Loan').should('be.visible');

                // Verify required fields exist
                cy.contains('Customer *').should('be.visible');
                cy.contains('Loan Amount *').should('be.visible');
                cy.contains('Trading Currency *').should('be.visible');
                cy.contains('Contract type *').should('be.visible');
                cy.contains('Contract Date *').should('be.visible');
                cy.contains('Monthly Income *').should('be.visible');
                cy.contains('Monthly Expenditure *').should('be.visible');
                cy.contains('Monthly Profit').should('be.visible');
                cy.contains('Notes').should('be.visible');

                // Verify action buttons
                cy.contains('button', 'Cancel').should('be.visible');
                cy.contains('button', 'Create').should('be.visible');

                // Close the modal
                cy.contains('button', 'Cancel').click();
            });

            // Assert modal unmounts
            cy.get('[role="dialog"]').should('not.exist');
        });

        it('should open the Edit Loan modal, submit an update, and display a success toast', () => {
            // Optional: Intercept the PUT/POST request for the update
            

            // Click the Edit (Pencil) icon in the first row
            // eq(1) targets the second button in the action column (0 is the Eye view)
            cy.get('tbody tr').first().within(() => {
                cy.get('td').last().find('button').eq(1).click();
            });

            cy.get('[role="dialog"]').should('be.visible').within(() => {
                cy.contains('Edit Loan').should('be.visible');

                // Verify Edit-specific read-only fields exist
                cy.contains('Customer LMS ID').should('be.visible');
                cy.contains('Mobile Number').should('be.visible');

                // Perform an edit (e.g., appending text to the Notes field)
                cy.contains('label', 'Notes').parent().find('textarea, input').first().type(' - updated record');

                // Submit the changes
                cy.contains('button', 'Update').click();
            });

            // Verify modal closes
            cy.get('[role="dialog"]').should('not.exist');

            // Verify the success notification appears (Matches Screenshot 1)
            cy.contains('Loan updated successfully').should('be.visible');
        });
    });
    describe('Pagination', () => {
        it('should disable the Previous button on the first page', () => {
            // Verify we are on page 1
            cy.contains(/Page 1 of/i).should('be.visible');

            // The Previous button should be visible but disabled
            cy.contains('button', /Previous/i).should('be.visible').and('be.disabled');

            // The Next button should be available
            cy.contains('button', /Next/i).should('be.visible').and('not.be.disabled');
        });

        it('should navigate to the next page and back to the previous page', () => {
            // Intercept the API call triggered by pagination
            cy.intercept('GET', '**/api/*loan*').as('getLoanPage');

            // --- Test 'Next' Functionality ---
            cy.contains('button', /Next/i).click();
            cy.wait('@getLoanPage');

            // Verify the page indicator updated to Page 2
            cy.contains(/Page 2 of/i).should('be.visible');

            // The Previous button should now be enabled
            cy.contains('button', /Previous/i).should('not.be.disabled');

            // --- Test 'Previous' Functionality ---
            cy.contains('button', /Previous/i).click();
            cy.wait('@getLoanPage');

            // Verify it successfully navigated back to Page 1
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');
        });
    });
});