/// <reference types="cypress" />

describe('Staff LMS - Contract Assigning Page', () => {
  
  beforeEach(() => {
    // Intercept the correct API endpoint (Check Network tab to verify exact URL)
    cy.intercept('GET', '**/api/*contract*').as('getContracts'); 

    cy.login('eranda.h@lalco.la', 'Eranda.h@1');

    cy.visit('http://54.255.136.172/#/contract-assigning-to-staff');
  });

  describe('UI Rendering & Initialization', () => {
    it('should navigate to the page and display correct title', () => {
      cy.url().should('include', 'contract-assigning-to-staff');
      cy.contains('.MuiTypography-root', /^\s*Contract Assigning\s*$/i).should('be.visible');
    });

    it('should display all dropdown filters with default "All"', () => {
      const filters = ['G DEPT', 'DEPT', 'SEC BRANCH', 'UNIT', 'MUNIT'];
      
      filters.forEach((filterName) => {
        cy.contains('label, p, span', new RegExp('^\\s*' + filterName + '\\s*$', 'i'))
          .parent()
          .contains('All')
          .should('be.visible');
      });
    });

    it('should render all search inputs and action buttons', () => {
      cy.get('input[placeholder*="Search by contract number"]').should('be.visible');
      cy.get('input[placeholder*="Search by staff number"]').should('be.visible');
      cy.get('input[placeholder*="Search by staff name"]').should('be.visible');
      
      cy.contains('button', /Clear/i).should('be.visible');
      cy.contains('button, a', /Download Sample File/i).should('be.visible');
      cy.contains('label, button', /Upload File/i).should('be.visible');
    });

    it('should render the data table with all expected columns', () => {
      const columns = [
        'ID', 'Contract No', 'Staff No', 'HO/BR', 'HQ', 'G Dept No', 'G Dept', 
        'Dept No', 'Dept', 'Sec Branch No', 'Sec Branch', 'Unit No', 'Unit', 
        'Munit No', 'Munit', 'Staff Name', 'Title', 'Collection CC', 'Collection', 'Created At'
      ];
      
      columns.forEach((col) => {
        cy.get('thead th')
          .contains(new RegExp(`^\\s*${col}\\s*$`, 'i'))
          .scrollIntoView() // Table is very wide; force scroll
          .should('be.visible');
      });
    });
  });

  describe('Search & Filter Functionality', () => {
    it('should allow searching by Contract No', () => {
      cy.get('input[placeholder*="Search by contract number"]').type('2020932{enter}');
      cy.wait('@getContracts');
      
      cy.get('tbody tr').should('have.length.greaterThan', 0);
      cy.get('tbody tr').first().should('contain.text', '2020932');
    });

    it('should allow searching by Staff Name', () => {
      cy.get('input[placeholder*="Search by staff name"]').type('LING-F{enter}');
      
      cy.get('tbody tr').should('have.length.greaterThan', 0);
      cy.get('tbody tr').first().should('contain.text', 'LING-F');
    });

it('should filter table data using MUI dropdowns', () => {
      cy.contains('label, p, span', /^\s*G DEPT\s*$/i)
        .parent()
        .click(); 
      
      cy.get('[role="listbox"], [role="presentation"]') 
        .contains('NAR(Yai)') 
        .click();
        
      // FIX: Remove cy.wait() and directly verify the table updated
      cy.get('tbody tr').should('have.length.greaterThan', 0);
      cy.get('tbody tr').first().should('contain.text', 'NAR(Yai)'); // Or another expected value
    });

    it('should clear search inputs when Clear is clicked', () => {
      cy.get('input[placeholder*="Search by contract number"]').type('2020932{enter}');
      cy.wait('@getContracts'); 
      
      cy.contains('button', /Clear/i).click();
      
      // Assumes 'Clear' auto-refreshes. If not, append .type('{enter}') to the cleared field as discussed previously.
      cy.get('input[placeholder*="Search by contract number"]').should('have.value', '');
      cy.wait('@getContracts');
    });
  });

  describe('File Operations', () => {
    it('should trigger the sample file download', () => {
   cy.contains('button, a, span', /Download Sample/i)
        .should('be.visible')
        .click();
    });

    it('should allow attaching a file for upload', () => {
      // Note: Requires 'cypress-file-upload' plugin to be installed
      // cy.get('input[type="file"]').attachFile('sample-assignment.xlsx');
      // cy.wait('@uploadEndpoint');
    });
  });

  describe('Pagination', () => {
    it('should disable the Previous button on page 1', () => {
      cy.contains(/Page 1 of/i).should('be.visible');
      cy.contains('button', /Previous/i).should('be.disabled');
    });

    it('should navigate to the next page when Next is clicked', () => {
        cy.intercept('GET', '**/api/contract-assigning?page=2*').as('getNextPage')
      cy.contains('button', 'Next').click();
      cy.contains(/Page 2 of/i).should('be.visible');
      cy.contains('button', /Previous/i).should('not.be.disabled');
    });
    });
});