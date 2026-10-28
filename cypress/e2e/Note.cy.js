/// <reference types="cypress" />

describe('Staff LMS - Notes Page', () => {

    beforeEach(() => {
        // Intercept API call for notes list (Adjust endpoint path as needed)
        cy.intercept('GET', '**/api/*note*').as('getNotes');
        cy.intercept('PUT', '**/api/*note*').as('updateNote');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1'); // Assuming standard login

        cy.visit('http://54.255.136.172/#/notes');
    });

    describe('UI Rendering & Initialization', () => {
        it('should navigate to the page and display the correct title', () => {
            cy.url().should('include', '/notes');
            cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Notes\s*$/i).should('be.visible');
        });

        it('should render the search input and Add Note button', () => {
            cy.get('input[placeholder*="Search note by subject, customer name or contract number"]').should('be.visible');
            cy.contains('button, a', /Add Note/i).should('be.visible');
        });

        it('should render the data table with all expected columns', () => {
            const columns = [
                'ID',
                'Subject',
                'Customer',
                'Contract',
                'Created By',
                'Created At',
                'Actions'
            ];

            columns.forEach((col) => {
                // Using .should('exist') instead of .be.visible to avoid sticky header scroll conflicts
                cy.get('thead th')
                    .contains(new RegExp(`^\\s*${col}\\s*$`, 'i'))
                    .should('exist');
            });
        });
    });

    describe('Global Actions - Add Note Modal', () => {
        it('should open the Add New Note modal and render all form fields', () => {
            // Click the Add Note button
            cy.contains('button, a', /Add Note/i).click();

            // Target the modal natively
            cy.get('[role="dialog"]').should('be.visible').within(() => {
                cy.contains('Add New Note').should('be.visible');

                // Verify required form fields exist
                cy.contains('Contract number *').should('be.visible');
                cy.contains('Subject *').should('be.visible');
                cy.contains('Note Details *').should('be.visible');
                cy.contains('Date').should('be.visible');

                // Verify action buttons exist
                cy.contains('button', 'Cancel').should('be.visible');
                cy.contains('button', 'Create').should('be.visible');

                // Close the modal
                cy.contains('button', 'Cancel').click();
            });

            // Verify modal closes
            cy.get('[role="dialog"]').should('not.exist');
        });
    });

    describe('Row-Level Actions', () => {
        it('should open the Note Details modal when the Eye icon is clicked', () => {
            cy.get('tbody tr').first().within(() => {
                // Extract Subject to verify in modal
                cy.get('td').eq(1).invoke('text').then((text) => {
                    // Sanitize hidden newlines/spaces from table cells to prevent cy.contains() exact-match failures
                    const cleanText = text.replace(/\s+/g, ' ').trim();
                    cy.wrap(cleanText).as('rowSubject');
                });

                // FIX 1: Specifically target 'button' to avoid accidentally clicking the inner <svg> of the first icon
                cy.get('td').last().find('button').eq(0).click();
            });

            cy.get('[role="dialog"]').should('be.visible').within(() => {
                cy.contains('Note Details').should('be.visible');

                // Verify extracted subject appears in the modal
                cy.get('@rowSubject').then((subject) => {
                    cy.contains(subject).should('be.visible');
                });

                // Verify modal sections
                cy.contains('Details').should('be.visible');
                cy.contains('Description').should('be.visible');
            });

            // Close the modal safely and verify it completely unmounts
            cy.get('[role="dialog"]').find('button[aria-label="close"], svg[data-testid="CloseIcon"]').first().click({ force: true });
            cy.get('[role="dialog"]').should('not.exist');
        });

        it('should open the Edit Note modal when the Pencil icon is clicked', () => {
            cy.get('tbody tr').first().within(() => {
                // FIX 2: Target the second 'button' (index 1) to reliably hit the Edit action
                cy.get('td').last().find('button').eq(1).click();
            });

            cy.get('[role="dialog"]').should('be.visible').within(() => {
                // Now this will correctly find the Edit Note modal
                cy.contains('Edit Note').should('be.visible');

                // Verify fields (Edit modal has 'Customer Name' which Add modal doesn't)
                cy.contains('Contract number *').should('be.visible');
                cy.contains('Customer Name').should('be.visible');
                cy.contains('Subject *').should('be.visible');
                cy.contains('Note Details *').should('be.visible');

                // Verify Update/Cancel buttons
                cy.contains('button', 'Cancel').should('be.visible');
                cy.contains('button', 'Update').should('be.visible');

                // Close modal
                cy.contains('button', 'Cancel').click();
            });

            // Assert it closes
            cy.get('[role="dialog"]').should('not.exist');
        });
    });

    describe('Search & Edit Functionality', () => {
        it('should allow searching by Subject, Customer Name, and Contract Number', () => {
            const searchInput = 'input[placeholder*="Search note by subject, customer name or contract number"]';

            // --- 1. Search by Subject ---
            const testSubject = 'test';
            cy.get(searchInput).clear().type(`${testSubject}{enter}`);
            cy.wait('@getNotes');
            cy.get('tbody tr').should('have.length.greaterThan', 0);
            cy.get('tbody tr').first().should('contain.text', testSubject);

            // --- 2. Search by Customer Name ---
            const testCustomer = 'VIENGKEO';
            cy.get(searchInput).clear().type(`${testCustomer}{enter}`);
            cy.wait('@getNotes');
            cy.get('tbody tr').should('have.length.greaterThan', 0);
            cy.get('tbody tr').first().should('contain.text', testCustomer);

            // --- 3. Search by Contract Number ---
            const testContract = '2001141';
            cy.get(searchInput).clear().type(`${testContract}{enter}`);
            cy.wait('@getNotes');
            cy.get('tbody tr').should('have.length.greaterThan', 0);
            cy.get('tbody tr').first().should('contain.text', testContract);

            // Cleanup: Clear the search bar to reset the table for subsequent tests
            cy.get(searchInput).clear().type('{enter}');
            cy.wait('@getNotes');
        });

        it('should edit a note and display the success notification', () => {
            // Optional: Intercept the update request if you want to explicitly wait for it
            // cy.intercept('PUT', '**/api/*note*').as('updateNote'); 

            // Click the Edit (Pencil) icon in the first row. 
            // We use .eq(1) to target the second button, avoiding the Eye icon at eq(0).
            cy.get('tbody tr').first().within(() => {
                cy.get('td').last().find('button').eq(1).click();
            });

            // Interact with the edit modal natively
            cy.get('[role="dialog"]').should('be.visible').within(() => {
                cy.contains('Edit Note').should('be.visible');

                // Perform an edit: append text to the Subject field
                cy.contains('Subject *').parent().find('input').type(' - updated');

                // Submit the changes
                cy.contains('button', 'Update').click();
            });

            // Verify the modal completely closes and unmounts
            cy.get('[role="dialog"]').should('not.exist');

            // Verify the toast notification appears exactly as shown in the screenshot
            cy.contains('Note updated successfully').should('be.visible');
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
            cy.intercept('GET', '**/api/*note*').as('getNotesPage');

            // --- Test 'Next' Functionality ---
            cy.contains('button', /Next/i).click();
            cy.wait('@getNotesPage');

            // Verify the page indicator updated to Page 2
            cy.contains(/Page 2 of/i).should('be.visible');

            // The Previous button should now be enabled
            cy.contains('button', /Previous/i).should('not.be.disabled');

            // --- Test 'Previous' Functionality ---
            cy.contains('button', /Previous/i).click();
            cy.wait('@getNotesPage');

            // Verify it successfully navigated back to Page 1
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');
        });
    });
});