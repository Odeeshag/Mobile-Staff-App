/// <reference types="cypress" />

describe('Staff LMS - Profile Page', () => {

    beforeEach(() => {
        // Intercept API call for profile data fetching
        // Adjust the endpoint pattern to match your actual backend route
        cy.intercept('GET', '**/api/*profile*').as('getProfileData');

        cy.login('eranda.h@lalco.la', 'Eranda.h@1'); // Adjust login as needed
        cy.visit('http://54.255.136.172/#/profile');
    });

    describe('UI Rendering & Read-Only Information', () => {
        it('should render the page title, user header, and all read-only information sections', () => {
            // Wait for initial data to load
            // cy.wait('@getProfileData');

            // Verify Page Title
            cy.contains('.MuiTypography-root, h1, h2, h3', /^\s*Profile\s*$/i).should('be.visible');

            // --- 1. User Header Section ---
            cy.contains('Harshana Eranda').should('be.visible');
            cy.contains('admin').should('be.visible');
            cy.contains(/Read only/i).should('be.visible');

            // --- 2. Basic Information Section ---
            cy.contains(/BASIC INFORMATION/i).should('be.visible');
            cy.contains(/ROLE/i).should('be.visible');
            cy.contains(/DEPARTMENT/i).should('be.visible');

            // --- 3. Contact Information Section ---
            cy.contains(/CONTACT INFORMATION/i).should('be.visible');
            cy.contains(/EMAIL/i).should('be.visible');
            // Verify actual data from screenshot
            cy.contains('eranda.h@lalco.la').should('be.visible');

            cy.contains(/PHONE/i).should('be.visible');
            cy.contains('2077366314').should('be.visible');

            cy.contains(/ADDRESS/i).should('be.visible');

            // --- 4. Personal Information Section ---
            cy.contains(/PERSONAL INFORMATION/i).should('be.visible');
            cy.contains(/GENDER/i).should('be.visible');
            cy.contains(/Female/i).should('be.visible');

            cy.contains(/DATE OF BIRTH/i).should('be.visible');
            cy.contains('2010-07-14').should('be.visible');
        });
    });

    describe('Change Password Functionality', () => {
        it.skip('should allow the user to fill out the change password form and submit', () => {
            // Intercept the POST/PUT request for the password change
            cy.intercept('POST', '**/api/*password*').as('changePassword');

            // Verify Section Title
            cy.contains(/Change Password/i).should('be.visible');

            // Define test passwords
            const currentPass = 'CurrentPass123!';
            const newPass = 'NewSecurePass456!';

            // Fill out the "Current Password" field
            // Using regex to handle any potential CSS text-transform casing issues
            cy.contains(/Current Password \*/i)
                .parent()
                .find('input')
                .first()
                .type(currentPass);

            // Fill out the "New Password" field
            cy.contains(/New Password \*/i)
                .parent()
                .find('input')
                .first()
                .type(newPass);

            // Fill out the "Confirm New Password" field
            cy.contains(/Confirm New Password \*/i)
                .parent()
                .find('input')
                .first()
                .type(newPass);

            // Optional: Test the eye icon toggle to reveal the password text
            // cy.contains(/Current Password \*/i).parent().find('button').click(); // Clicks the visibility toggle
            // cy.contains(/Current Password \*/i).parent().find('input').should('have.attr', 'type', 'text');

            // Submit the form
            cy.contains('button', /Save New Password/i).click();

            // Wait for the network request to finish before checking the UI
            // cy.wait('@changePassword');

            // Verify success toast/notification appears
            // Adjust the regex to match your application's actual success message
            cy.contains(/Successfully|Password updated|Password changed/i).should('be.visible');

            // Verify form fields are cleared after successful submission (if applicable to your app's behavior)
            cy.contains(/Current Password \*/i).parent().find('input').should('be.empty');
        });

        it.skip('should display validation errors if new passwords do not match', () => {
            cy.contains(/New Password \*/i).parent().find('input').first().type('ValidPass123!');
            cy.contains(/Confirm New Password \*/i).parent().find('input').first().type('MismatchPass999!');

            cy.contains('button', /Save New Password/i).click();

            // Verify validation error message appears in the DOM
            cy.contains(/Passwords must match|Passwords do not match/i).should('be.visible');
        });
    });
});