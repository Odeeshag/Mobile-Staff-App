/// <reference types="cypress" />

describe('Staff LMS - Staff Page', () => {

    beforeEach(() => {
        // Intercept API calls for table data
        // Adjust the endpoint to match your actual backend route (e.g., /api/staff)
        cy.intercept('GET', '**/api/*staff*').as('getStaffData');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1'); // Adjust login as needed
        cy.visit('http://54.255.136.172/#/staff');
    });

    describe('UI Rendering & Team Toggles', () => {
        it('should render the default Sales Team view and its specific filters', () => {
            // Verify Page Title
            cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Staff\s*$/i).should('be.visible');

            // Verify Search Input and Clear button
            cy.get('input[placeholder*="Search by staff no, name, or phone"]').should('be.visible');
            cy.contains('button, a', /Clear/i).should('be.visible');

            // Verify Team Toggle Buttons
            cy.contains('button, div, span', /Sales Team/i).should('be.visible');
            cy.contains('button, div, span', /Collection Team/i).should('be.visible');

            // Verify Default Sales Team Filters (From Screenshot 1)
            cy.contains(/G DEPARTMENT/i).should('be.visible');
            cy.contains(/DEPARTMENT/i).should('be.visible');
            cy.contains(/BRANCH/i).should('be.visible');
            cy.contains(/UNIT/i).should('be.visible');
            cy.contains(/MINI UNIT/i).should('be.visible');

            // Verify Table Columns
            const columns = ['Staff No', 'Name', 'Email', 'Phone', 'Role', 'Actions'];
            columns.forEach((col) => {
                cy.get('thead th')
                    .contains(col, { matchCase: false })
                    .should('exist');
            });
        });

        it('should switch to the Collection Team view and update the dynamic filters', () => {
            // Click the Collection Team toggle
            cy.contains('button, div, span', /Collection Team/i).click();
            cy.wait('@getStaffData');

            // Verify Dynamic Collection Team Filters (From Screenshot 2)
            cy.contains(/G DEPARTMENT/i).should('be.visible');
            cy.contains(/DEPARTMENT/i).should('be.visible');
            cy.contains(/COLLECTION UNIT/i).should('be.visible');
            cy.contains(/COLLECTION TL/i).should('be.visible');
            cy.contains(/COLLECTION/i).should('be.visible');

            // Ensure filters from Sales Team are no longer visible
            cy.contains(/MINI UNIT/i).should('not.exist');
        });
    });

    describe('Search Functionality', () => {
        it('should filter the table correctly when searching by Staff No', () => {
            const searchInput = 'input[placeholder*="Search by staff no, name, or phone"]';
            const testStaffNo = '4381'; // From the first row in Screenshot 1

            // Execute search
            cy.get(searchInput).clear().type(`${testStaffNo}{enter}`);
            cy.wait('@getStaffData');

            // Verify table filters down to the correct record
            cy.get('tbody tr').should('have.length.greaterThan', 0);

            // Staff No is in the first column (index 0)
            cy.get('tbody tr').first().find('td').eq(0).should('contain.text', testStaffNo);
        });
    });

    describe('Row-Level Actions - View Staff Details Modal', () => {
        it('should open the Staff Details modal when the Eye icon is clicked', () => {
            cy.wait('@getStaffData');
            cy.get('tbody tr').should('have.length.greaterThan', 0);

            cy.get('tbody tr').first().within(() => {
                // Click the Eye icon (index 0)
                cy.get('td').last().find('button').eq(0).click();
            });

            // Verify the modal opens and contains the expected sections
            cy.get('[role="dialog"]').should('be.visible').within(() => {
                cy.contains('Staff Details').should('be.visible');

                // Verify structural sections from Screenshot 3
                cy.contains(/Staff ID:/i).should('be.visible');
                cy.contains(/Staff No:/i).should('be.visible');
                cy.contains('CONTACT INFORMATION').should('be.visible');
                cy.contains('Email').should('be.visible');
                cy.contains('Phone').should('be.visible');
                cy.contains('PERSONAL INFORMATION').should('be.visible');
                cy.contains('Birth Date').should('be.visible');
                cy.contains('Family Book').should('be.visible');
                cy.contains('Gender').should('be.visible');

                // Close the modal using the top right 'X' icon
                cy.get('button[aria-label="close"], svg[data-testid="CloseIcon"]').first().click({ force: true });
            });

            cy.get('[role="dialog"]').should('not.exist');
        });
    });

   describe('Row-Level Actions - Reset Password Modal', () => {
        it('should open the Reset Password modal, verify validation text, and submit', () => {
            // Intercept the POST request for the password reset
            cy.intercept('POST', '**/api/*password*').as('resetPassword');

            cy.wait('@getStaffData');

            cy.get('tbody tr').first().within(() => {
                // Click the Pencil icon (index 1)
                cy.get('td').last().find('button').eq(1).click();
            });

            cy.get('[role="dialog"]').should('be.visible').within(() => {
                // Verify Modal Title and Elements
                cy.contains('h2, div, p', /^\s*Reset Password\s*$/i).should('be.visible');
                cy.contains('Update Password').should('be.visible');

                // Verify Input Fields
                cy.contains(/New Password/i).should('be.visible');
                cy.contains(/Confirm New Password/i).should('be.visible');

                // Verify Validation Rules Text
                cy.contains(/Password must be at least 8 characters/i).should('be.visible');
                cy.contains(/Password must contain at least one uppercase letter/i).should('be.visible');
                cy.contains(/Password must contain at least one number/i).should('be.visible');

                // Fill out the password fields
                const newPass = 'ValidPass123!';

                cy.contains(/New Password/i).parent().find('input').first().type(newPass);
                cy.contains(/Confirm New Password/i).parent().find('input').first().type(newPass);

                // Submit the form
                cy.contains('button', 'Reset Password').click();
            });

            // FIX 1: Wait for the network request to finish to avoid race conditions
            cy.wait('@resetPassword');

            // Verify success toast/notification
            cy.contains(/Successfully|Updated|Reset/i).should('be.visible');

            // FIX 2: Handle the application's transition back to the "Staff Details" view
            cy.get('[role="dialog"]').should('be.visible').within(() => {
                cy.contains('Staff Details').should('be.visible');
                
                // Close the modal using the 'X' button to clean up the state
                cy.get('button[aria-label="close"], svg[data-testid="CloseIcon"]').first().click({ force: true });
            });

            // Verify the modal is now completely closed
            cy.get('[role="dialog"]').should('not.exist');
        });
    });

    describe('Pagination', () => {
        it('should navigate through table pages', () => {
            cy.wait('@getStaffData');

            // Hard wait to allow trailing React background effects to settle.
            // This prevents race conditions where late network resolves overwrite the Next click.
            cy.wait(1000);

            cy.get('tbody tr').should('have.length.greaterThan', 0);

            // Verify initial state
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');

            // Click Next
            cy.contains('button', /Next/i).click();
            cy.wait('@getStaffData');

            // Verify Page 2
            cy.contains(/Page 2 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('not.be.disabled');

            // Click Previous
            cy.contains('button', /Previous/i).click();
            cy.wait('@getStaffData');

            // Verify return to Page 1
            cy.contains(/Page 1 of/i).should('be.visible');
            cy.contains('button', /Previous/i).should('be.disabled');
        });
    });
});