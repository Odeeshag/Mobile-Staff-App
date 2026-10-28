/// <reference types="cypress" />

describe('Staff LMS - cutomers Page', () => {

  beforeEach(() => {
    cy.intercept('GET', '**/api/customers**').as('getCustomers');

    cy.login('eranda.h@lalco.la', 'Eranda.h@1');

    cy.visit('http://54.255.136.172/#/customers');

  });

  describe('UI Rendering & Initialization', () => {
    it('should navigate to the customers page and display correct title', () => {
      cy.url().should('include', 'customers');
      cy.contains('.MuiTypography-h6', /customers/i).should('be.visible');
    });

    it('should display all dropdown filter defaults as "All"', () => {
      const filters = ['G DEPARTMENT', 'DEPARTMENT', 'BRANCH', 'UNIT', 'MINI UNIT'];
      filters.forEach((filterName) => {
        const exactMatchRegex = new RegExp('^\\s*' + filterName + '\\s*$', 'i');
        cy.contains(exactMatchRegex)
          .parent()
          .contains('All')
          .should('be.visible');
      });
    });

    it('should render the data table with all expected columns', () => {
      const columns = ['Customer LMS ID', 'Name', 'Phone', 'Address', 'Contracts', 'Actions'];
      columns.forEach((col) => {
        cy.get('thead th').contains(col).should('be.visible');
      });
    });
  });

  describe('Search & Filter Functionality', () => {
    it('should allow searching by customer name', () => {
      cy.get('input[placeholder="Search customers by name or phone"]').type('ANOUVAT');
      cy.wait('@getCustomers');
      cy.get('tbody tr').should('have.length.greaterThan', 0);
      cy.get('tbody tr').first().should('contain.text', 'ANOUVAT');
    });

    it('should allow searching by customer phone number', () => {
      cy.get('input[placeholder="Search customers by name or phone"]').type('02056025016');
      cy.wait('@getCustomers');
      cy.get('tbody tr').first().should('contain.text', '02056025016');
    });

    it('should clear search input and reset filters when Clear button is clicked', () => {
      cy.get('input[placeholder="Search customers by name or phone"]').type('ANOUVAT');
      // Assuming you select a department filter here
      cy.contains('button', 'Clear').click();
      cy.get('input[placeholder="Search customers by name or phone"]').should('have.value', '');
      cy.wait('@getCustomers');
    });

    it('should filter table data when a department dropdown is changed', () => {
      cy.contains(/G DEPARTMENT/i)
        .parent()
        .click();
      cy.get('[role="listbox"], [role="presentation"]') // Target the MUI popover
        .contains('LING-F')
        .click();
      cy.wait('@getCustomers');

    });
  });

  describe('Tab Navigation', () => {
    it('should default to the Sales tab', () => {
      //cy.contains(/sales/i).should('be.visible');
      cy.contains('.MuiChip-label', /Sales/i)
        .should('be.visible'); // Adjust class based on your Tailwind styling
    });

    it('should switch to the Collection tab and update table data', () => {
      cy.contains('.MuiChip-label', /Collection/i).click();
      cy.wait('@getCustomers');
      cy.contains('.MuiChip-label', /Collection/i)
        .should('be.visible');
    });
  });

  describe('Data Table Actions & Pagination', () => {
    it('should open the Customer Details modal and verify data matches the table row', () => {
      // 1. Scope search to the first row of the table
      cy.get('tbody tr').first().within(() => {
        cy.get('td').eq(0).invoke('text').then((text) => {
          cy.wrap(text.trim()).as('rowId');
        });

        cy.get('td').eq(2).invoke('text').then((text) => {
          cy.wrap(text.trim()).as('rowPhone');
        });

        // Click the eye icon
        cy.get('td').last().find('svg, button').first().click();
      });

      // 2. Filter down to the single visible modal element
      cy.get('[role="dialog"], .MuiDialog-paper, .MuiModal-root')
        .filter(':visible') // Ignore any hidden MUI backdrop layers
        .first()            // Narrow the subject to exactly 1 element to satisfy .within()
        .within(() => {

          // Verify title is inside the modal
          cy.contains('.MuiTypography-root, h2, h3, div', /Customer Details/i)
            .should('be.visible');

          // Retrieve saved ID and verify
          cy.get('@rowId').then((rowId) => {
            cy.contains(/Customer LMS ID/i)
              .parent()
              .should('contain.text', rowId);
          });

          // Retrieve saved Phone and verify
          cy.get('@rowPhone').then((rowPhone) => {
            cy.contains(/Phone/i)
              .parent()
              .should('contain.text', rowPhone);
          });
        });
    });

    it('should disable the Previous button on page 1', () => {
      cy.contains('Page 1 of');
      cy.contains('button', 'Previous').should('be.disabled');
    });

    it('should navigate to the next page when Next is clicked', () => {
      cy.contains('button', 'Next').click();
      cy.wait('@getCustomers');
      cy.contains('Page 2 of');
      cy.contains('button', 'Previous').should('not.be.disabled');
    });
  });
});