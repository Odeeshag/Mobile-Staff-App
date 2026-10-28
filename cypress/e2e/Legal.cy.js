/// <reference types="cypress" />

describe('Staff LMS - Legal Page', () => {

    beforeEach(() => {
        cy.intercept('GET', '**/api/*soa-cases*').as('getLegalData');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1');

        cy.visit('http://54.255.136.172/#/legal'); 
    });

    describe('UI Rendering, Search & Filtering', () => {
        it('should render the page layout, table headers, search bar, and filter buttons', () => {
            // Verify Page Title
            cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Legal\s*$/i).should('be.visible');

            // Verify Search Input
            cy.get('input[placeholder*="Search by contract number"]').should('be.visible');

            // Verify Filter Pills/Buttons
            cy.contains('button, div, span', /^All$/).should('be.visible');
            cy.contains('button, div, span', /^Pending$/).should('be.visible');
            cy.contains('button, div, span', /^Approve$/).should('be.visible');
            cy.contains('button, div, span', /^Closed$/).should('be.visible');

            // Verify Table Columns
            const columns = ['ID', 'Contract No', 'Customer', 'Legal status', 'Notes', 'Created', 'Actions'];
            columns.forEach((col) => {
                cy.get('thead th')
                    .contains(new RegExp(`^\\s*${col}\\s*$`, 'i'))
                    .should('exist'); // Use 'exist' to avoid sticky header overlap issues
            });
        });

        it('should filter the table correctly when searching by Contract Number', () => {
            const searchInput = 'input[placeholder*="Search by contract number"]';
            const testContractNo = '2055174'; // From the first screenshot

            // Execute search
            cy.get(searchInput).clear().type(`${testContractNo}{enter}`);
            cy.wait('@getLegalData');

            // Verify table filters down to the correct record
            cy.get('tbody tr').should('have.length.greaterThan', 0);
            cy.get('tbody tr').first().find('td').eq(1).should('contain.text', testContractNo);
        });

        it('should trigger network requests when interacting with Status Filters', () => {
            // Click 'Pending' filter
            cy.contains('button, div, span', /^Pending$/).click();
            cy.wait('@getLegalData');

            // Click 'Approve' filter
            cy.contains('button, div, span', /^Approve$/).click();
            cy.wait('@getLegalData');

            // Click 'Closed' filter
            cy.contains('button, div, span', /^Closed$/).click();
            cy.wait('@getLegalData');

            // Reset back to 'All'
            cy.contains('button, div, span', /^All$/).click();
            cy.wait('@getLegalData');
        });
    });

    describe('Row-Level Actions - View Modal', () => {
        it('should open the Case details modal when the Eye icon is clicked', () => {
            cy.get('tbody tr').first().within(() => {
                // Click the Eye icon (index 0)
                cy.get('td').last().find('button').eq(0).click();
            });

            cy.get('[role="dialog"]').should('be.visible').within(() => {
                // Verify Modal Title
                cy.contains('Case details').should('be.visible');

                // Verify the 3 main read-only sections exist
                cy.contains('Case details').should('be.visible');
                cy.contains('Case progress').should('be.visible');
                cy.contains('Legal status').should('be.visible');

                // Close the modal using the top right 'X' icon
                // Using .first() in case multiple SVGs match the selector
            });
            
            cy.get('[role="dialog"]').find('button[aria-label="close"], svg[data-testid="CloseIcon"]').first().click({ force: true });
            cy.get('[role="dialog"]').should('not.exist');
        });
    });

    describe('Row-Level Actions - Edit Modal & Document Upload', () => {
        it('should open the Legal Action modal, render the form, handle document upload, and submit', () => {
            // Optional: Intercept the PUT/POST request for the submission
            cy.intercept('POST', '**/api/*legal*').as('submitLegalAction');

            cy.get('tbody tr').first().within(() => {
                // Click the Pencil icon (index 1)
                cy.get('td').last().find('button').eq(1).click();
            });

            cy.get('[role="dialog"]').should('be.visible').within(() => {
                // Verify Modal Title
                cy.contains('Legal Action').should('be.visible');

                // Verify Form Fields exist
                cy.contains('Update status *').should('be.visible');
                cy.contains('Status').should('be.visible');
                cy.contains('Legal action note *').should('be.visible');
                cy.contains('Court / Office').should('be.visible');
                cy.contains('Officer name').should('be.visible');
                cy.contains('Claimed amount').should('be.visible');
                cy.contains('Trading Currency *').should('be.visible');
                cy.contains('Payment confirmation issued?').should('be.visible');
                
                // Interact with inputs (Updating the mandatory action note)
                cy.contains('Legal action note *').parent().find('textarea, input').first().type('Cypress test automated note update');

                // Scroll to view the bottom fields to prevent them hiding behind a sticky footer
                cy.contains('Document Upload').scrollIntoView().should('be.visible');

                // --- Document Upload Test ---
                // MUI file uploads use a hidden <input type="file"> under the "File" button.
                // We use { force: true } and generate a PDF buffer in-memory to test the upload natively.
                cy.get('input[type="file"]').first().selectFile({
                    contents: Cypress.Buffer.from('mock pdf data content'),
                    fileName: 'court_order.pdf',
                    mimeType: 'application/pdf'
                }, { force: true });

                // Verify the UI updates to reflect the uploaded file
                // It should replace "No file selected" with the filename
                cy.contains('court_order.pdf').should('exist');

                // Submit the decision
                cy.contains('button', 'Submit decision').scrollIntoView().click();
            });

            // Verify the modal closes
            cy.get('[role="dialog"]').should('not.exist');

            // Verify success toast/notification (adjust text pattern to match your app's actual success message)
            cy.contains(/Successfully|Updated/i).should('be.visible');
        });
    });
    describe('Pagination', () => {
        it('should disable the Previous button on the first page', () => {
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.visible').and('be.disabled');
            cy.contains('button', /Next/i).should('be.visible').and('not.be.disabled');
        });

        it('should navigate to the next page and back to the previous page', () => {
            cy.wait('@getLegalData');

            // Click Next
            cy.contains('button', /Next/i).click();
            cy.wait('@getLegalData');

            // Verify Page 2 and enabled Previous button
            cy.contains(/Page 2 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('not.be.disabled');

            // Click Previous
            cy.contains('button', /Previous/i).click();
            cy.wait('@getLegalData');

            // Verify return to Page 1
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');
        });
    });
});