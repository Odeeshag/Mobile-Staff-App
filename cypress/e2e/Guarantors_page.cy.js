/// <reference types="cypress" />

describe('Staff LMS - Guarantors Page', () => {
  
  beforeEach(() => {
    cy.intercept('GET', '**/api/get-guarantors**').as('getGuarantors') 

    cy.login('eranda.h@lalco.la', 'Eranda.h@1');    
    
    cy.visit('http://54.255.136.172/#/guarantors');
  });

  describe('UI Rendering & Initialization', () => {
    it('should navigate to the guarantors page and display correct title', () => {
      cy.url().should('include', 'guarantors');
      
      // Target the title using MUI class and case-insensitive regex
      cy.contains('.MuiTypography-root', /^\s*Guarantors\s*$/i).should('be.visible');
    });

    it('should display all dropdown filter defaults as "All"', () => {
      const filters = ['G DEPARTMENT', 'DEPARTMENT', 'BRANCH', 'UNIT', 'MINI UNIT'];
      
      filters.forEach((filterName) => {
        cy.contains('label, p, span', new RegExp('^\\s*' + filterName + '\\s*$', 'i'))
          .parent()
          .contains('All')
          .should('be.visible');
      });
    });

    it('should render the data table with all expected columns', () => {
      const columns = [
        'LMS Guarantor ID', 
        'Contract No', 
        'Guarantor Name', 
        'Lao Name', 
        'Phone', 
        'Relationship', 
        'Address', 
        'Actions'
      ];
      columns.forEach((col) => {
        cy.get('thead th').contains(new RegExp(col, 'i')).should('be.visible');
      });
    });
  });

  describe('Search & Filter Functionality', () => {
    it('should allow searching by guarantor name, contract, or phone', () => {
      // Append {enter} to trigger the search submission
      cy.get('input[placeholder*="Search contract, name, or phone"]').type('02094859613{enter}');
      
      // If this still times out, verify the exact network URL in your browser's DevTools
      cy.wait('@getGuarantors');
      
      cy.get('tbody tr').should('have.length.greaterThan', 0);
      cy.get('tbody tr').first().should('contain.text', '02094859613');
    });

it('should clear search input when Clear button is clicked', () => {
    cy.get('input[placeholder*="Search contract, name, or phone"]').type('lahiru perera{enter}');
    cy.wait('@getGuarantors'); 
    
    cy.contains('button', /Clear/i).click();
    cy.get('input[placeholder*="Search contract, name, or phone"]').should('have.value', '');
    
    // FIX: Remove cy.wait() and verify the table repopulates with the default list
    cy.get('tbody tr').should('have.length.greaterThan', 1);
  });

    it('should display empty state when no matching records are found', () => {
      cy.get('input[placeholder*="Search contract, name, or phone"]').type('INVALID_GUARANTOR_XYZ{enter}');
      cy.wait('@getGuarantors');
      
      cy.contains(/No matching records found/i).should('be.visible');
      cy.contains(/We couldn't find any guarantors matching your search/i).should('be.visible');
    });

    it('should filter table data when a department dropdown is changed', () => {
      cy.contains('label, p, span', /^\s*G DEPARTMENT\s*$/i)
        .parent()
        .click(); 
      
      cy.get('[role="listbox"], [role="presentation"]') 
        .contains('LING-F') 
        .click();
        
      cy.wait('@getGuarantors');
    });
  });

  describe('Tab Navigation', () => {
    it('should default to the Sales tab', () => {
      cy.contains('.MuiChip-label', /Sales/i).should('be.visible'); 
    });

    it('should switch to the Collection tab', () => {
      cy.contains('.MuiChip-label', /Collection/i).click();
      cy.wait('@getGuarantors');
      cy.contains('.MuiChip-label', /Collection/i).should('be.visible');
    });
  });

  describe('Data Table Actions & Pagination', () => {
    it('should open the Guarantor Details modal and verify data matches the table row', () => {
      // 1. Ensure table has data, then scope to first row
      cy.get('tbody tr').should('not.contain.text', 'No matching records').first().within(() => {
        // Extract LMS Guarantor ID (1st column)
        cy.get('td').eq(0).invoke('text').then((text) => {
          cy.wrap(text.trim()).as('rowId');
        });
        
        // Extract Contract No (2nd column)
        cy.get('td').eq(1).invoke('text').then((text) => {
          cy.wrap(text.trim()).as('rowContract');
        });

        // Click action button (eye icon)
        cy.get('td').last().find('svg, button').first().click();
      });

      // 2. Filter down to the single visible modal element
      cy.get('[role="dialog"], .MuiDialog-paper, .MuiModal-root')
        .filter(':visible')
        .first()
        .within(() => {
          // Verify modal opened
          cy.contains('.MuiTypography-root, h2, h3, div', /Guarantor Details/i).should('be.visible');

          // Verify saved ID matches
          cy.get('@rowId').then((rowId) => {
            cy.contains(/LMS Guarantor ID/i).parent().should('contain.text', rowId);
          });

          // Verify saved Contract No matches
          cy.get('@rowContract').then((rowContract) => {
            cy.contains(/Contract No/i).parent().should('contain.text', rowContract);
          });
      });
    });

      it('should navigate to the next page when Next is clicked', () => {
      cy.contains('button', 'Next').click();
      cy.wait('@getGuarantors');
      cy.contains('Page 2 of');
      cy.contains('button', 'Previous').should('not.be.disabled');
    });

    it('should disable the Previous button on page 1', () => {
      cy.contains(/Page 1 of/i).should('be.visible');
      cy.contains('button', /Previous/i).should('be.disabled');
    });
  });
});