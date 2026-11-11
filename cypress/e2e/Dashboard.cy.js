/// <reference types="cypress" />

describe('Staff LMS - Dashboard Page', () => {

  // Helper to locate the main Team / Department filter dropdown on the Dashboard
  const getTeamDropdown = () =>
    cy.contains('label', /^Team$/i)
      .parent()
      .find('.MuiSelect-select, [role="combobox"]')
      .first();

  // Helper to locate any filter dropdown by its label text
  const getFilterDropdown = (labelRegex) =>
    cy.contains('label', labelRegex)
      .parent()
      .find('.MuiSelect-select, [role="combobox"]')
      .first();

  beforeEach(() => {
    cy.login('eranda.h@lalco.la', 'Eranda.h@1');
    cy.visit('http://54.255.136.172/#/');
  });

  context('Navigation & Header UI', () => {
    it('should display all main sidebar navigation items', () => {
      const menuItems = [
        'Dashboard', 'Customers', 'Guarantors', 'Sales', 'Collateral',
        'Contract Assigning', 'Loans', 'Payments', 'Collection and Legal Team',
        'Legal Candidates', 'Legal', 'Village Master', 'Tasks',
        'Customer Visit List', 'Follow Ups', 'Call History', 'Notes',
        'LMS Data Sync', 'Profile', 'Staff', 'Organization Structure'
      ];

      menuItems.forEach(item => {
        cy.get('aside, nav').contains(item).scrollIntoView().should('be.visible');
      });
    });

    it('should display sidebar section subheaders', () => {
      const sections = ['Overview', 'General', 'Operations', 'Account'];

      sections.forEach(section => {
        cy.get('aside, nav').contains( new RegExp(`^\\s*${section}\\s*$`, 'i'))
          .scrollIntoView()
          .should('be.visible');
      });
    });

    it('should display the header elements', () => {
      cy.get('header').contains('Dashboard').should('be.visible');
      cy.contains('EN').should('be.visible');
      cy.get('header').find('button, svg').should('have.length.greaterThan', 0);
    });
  });

  context('User Profile Section', () => {
    it('should display the logged-in user details in the sidebar', () => {
      cy.contains(/Harshana Eranda/i).should('be.visible');
      cy.contains('admin').should('be.visible');
      cy.contains('eranda.h@lalco.la').should('be.visible');
    });
  });

  context('Welcome Banner', () => {
    it('should display the correct welcome message and company info', () => {
      cy.contains('Welcome back - Today').should('be.visible');
      cy.contains(/Harshana Eranda/i).should('be.visible');
      cy.contains('Lao Asean Leasing Public Company').should('be.visible');
      cy.contains(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d+ (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/).should('be.visible');
    });
  });

  context('Task Metrics Widgets', () => {
    it('should render Today Task metrics accurately', () => {
      cy.contains('Today Task').should('be.visible');
      cy.contains('Today Task').parents('.MuiCard-root').first().within(() => {
        cy.contains('Total').should('be.visible');

        cy.contains('Calls').parent().parent().within(() => {
          cy.contains(/\d+%/).should('be.visible');
          cy.contains(/Done/i).should('be.visible');
          cy.contains('Pending').should('be.visible');
        });

        cy.contains('Visits').parent().parent().within(() => {
          cy.contains(/\d+%/).should('be.visible');
          cy.contains(/Done/i).should('be.visible');
          cy.contains('Pending').should('be.visible');
        });
      });
    });

    it('should render This Month Task metrics accurately including Calls and Visits breakdowns', () => {
      cy.contains('This Month Task').should('be.visible');
      cy.contains('This Month Task').parents('.MuiCard-root').first().within(() => {
        cy.contains('Total').should('be.visible');

        cy.contains('Calls').parent().parent().within(() => {
          cy.contains(/\d+%/).should('be.visible');
          cy.contains(/Done/i).should('be.visible');
          cy.contains('Pending').should('be.visible');
        });

        cy.contains('Visits').parent().parent().within(() => {
          cy.contains(/\d+%/).should('be.visible');
          cy.contains(/Done/i).should('be.visible');
          cy.contains('Pending').should('be.visible');
        });
      });
    });

    it('should open the dropdown and display all available options', () => {
      cy.contains('All Departments').click();

      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible').within(() => {
        cy.contains('All Departments').should('exist');
        cy.contains('Sales').should('exist');
        cy.contains('Collection').should('exist');
      });

      cy.get('body').type('{esc}');
    });

    it('should render the correct dynamic filter fields when "Collection" is selected', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      const collectionFilterLabels = [
        '^\\s*Team\\s*$',
        '^\\s*G Dept\\s*$',
        '^\\s*Collection Unit\\s*$',
        '^\\s*Collection TL\\s*$',
        '^\\s*Collection\\s*$'
      ];

      collectionFilterLabels.forEach(label => {
        cy.contains('label', new RegExp(label, 'i')).should('be.visible');
      });

      cy.contains('Select G Dept').should('be.visible');
      cy.contains('Select Unit').should('be.visible');
      cy.contains('Select TL').should('be.visible');
      cy.contains('Select Collection').should('be.visible');

      cy.contains('button', 'Clear').click();
    });

    it('should render the correct dynamic filter fields when "Sales" is selected', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      const salesFilterLabels = [
        '^\\s*Team\\s*$',
        '^\\s*G Department\\s*$',
        '^\\s*Department\\s*$',
        '^\\s*Branch\\s*$',
        '^\\s*Unit\\s*$',
        '^\\s*Mini Unit\\s*$'
      ];

      salesFilterLabels.forEach(label => {
        cy.contains('label', new RegExp(label, 'i')).should('be.visible');
      });

      cy.contains('button', 'Clear').click();
    });

    it('should clear the selected department and reset dynamic filters on Clear', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains(/COLLECTION UNIT/i).should('be.visible');

      cy.contains('button', 'Clear').click();

      getTeamDropdown().should('not.contain.text', 'Collection');
      getTeamDropdown().should('contain.text', 'All Departments');
    });
  });

  context('Team Dashboard Overview', () => {
    it('should display the department filter and default to All Departments', () => {
      cy.contains('Team Dashboard Overview').should('be.visible');
      cy.contains('label', /^Team$/i).should('be.visible');
      cy.contains('All Departments').should('be.visible');
    });

    it('should render the Task Status Breakdown chart and labels', () => {
      cy.contains('Task Status Breakdown').should('be.visible');
      cy.contains('Active Cases').should('be.visible');
      cy.contains(/Overdue: \d+/).should('be.visible');
      cy.contains(/Done Today: \d+/).should('be.visible');
    });

    it('should render the Task Aging Breakdown chart and labels', () => {
      cy.contains('Task Aging Breakdown').should('be.visible');
      cy.contains(/OA Cases: \d+/).should('be.visible');
      cy.contains(/Total: \d+/).should('be.visible');
    });
  });

  context('Dashboard Filter Section - Detailed Tests', () => {

    // ── Department Filter ──────────────────────────────────────────────────

    it('should display a default selected value in the Department dropdown on page load TC-001', () => {
      cy.contains('Team Dashboard Overview').should('be.visible');
      getTeamDropdown()
        .invoke('text')
        .should('not.be.empty')
        .and('include', 'All Departments');
    });

    it('should open the Department dropdown and list All Departments, Sales, and Collection TC-002', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().within(() => {
        cy.contains('All Departments').should('be.visible');
        cy.contains('Sales').should('be.visible');
        cy.contains('Collection').should('be.visible');
      });

      cy.get('body').type('{esc}');
    });

    it('should update the Department field to Sales when Sales is selected TC-003', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      getTeamDropdown().should('contain.text', 'Sales');

      cy.contains('button', 'Clear').click();
    });

    it('should show All Departments option and display unfiltered data when selected TC-012', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('All Departments').click();

      getTeamDropdown().should('contain.text', 'All Departments');
    });

    it('should show dashboard charts when only the Department filter is applied TC-017', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Task Status Breakdown').should('be.visible');
      cy.contains('Task Aging Breakdown').should('be.visible');

      cy.contains('button', 'Clear').click();
    });

    // ── G Department Filter ────────────────────────────────────────────────

    it('should show Select G Dept placeholder after selecting Collection department TC-005', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();
      cy.contains('Select G Dept').should('be.visible');

      cy.contains('button', 'Clear').click();
    });

    it('should populate G Dept dropdown with options after selecting Sales department TC-004', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      cy.contains('Select G Dept').click();

      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .find('li')
        .should('have.length.greaterThan', 0);

      cy.get('body').type('{esc}');
      cy.contains('button', 'Clear').click();
    });

    // ── Dependent Filter Cascade ───────────────────────────────────────────

    it('should display correct placeholder texts for all filter dropdowns after selecting Collection TC-018', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Select G Dept').should('be.visible');
      cy.contains('Select Unit').should('be.visible');
      cy.contains('Select TL').should('be.visible');
      cy.contains('Select Collection').should('be.visible');

      cy.contains('button', 'Clear').click();
    });

    it('should reset downstream dropdowns when Department selection is changed TC-011', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();
      cy.contains(/COLLECTION UNIT/i).should('be.visible');

      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      cy.contains('Select G Dept').should('be.visible');
      cy.contains(/COLLECTION UNIT/i).should('not.exist');
      cy.contains('button', 'Clear').click();
    });

    // ── Clear Filter Functionality ─────────────────────────────────────────

    it('should have the Clear button disabled by default when All Departments is selected', () => {
      getTeamDropdown().should('contain.text', 'All Departments');
      cy.contains('button', 'Clear').should('be.visible').and('be.disabled');
    });

    it('should reset all filter dropdowns to default state when Clear is clicked TC-008', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();
      cy.contains(/COLLECTION UNIT/i).should('be.visible');

      cy.contains('button', 'Clear').should('not.be.disabled').click();

      getTeamDropdown().should('not.contain.text', 'Collection');
      cy.contains('All Departments').should('be.visible');
      cy.contains('button', 'Clear').should('be.disabled');
    });

    it('should not cause errors when Clear is clicked after applying a filter TC-015', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();
      cy.contains('button', 'Clear').should('be.visible').and('not.be.disabled').click();

      cy.contains('Team Dashboard Overview').should('be.visible');
      cy.contains('All Departments').should('be.visible');
    });

    // ── Filter UI & Layout ─────────────────────────────────────────────────

    it('should display all filter labels and the Clear button in the filter section TC-013', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('label', /^Team$/i).should('be.visible');
      cy.contains('label', /^G Dept$/i).should('be.visible');
      cy.contains('Team Dashboard Overview').should('be.visible');
      cy.contains('button', 'Clear').should('be.visible');

      cy.contains('button', 'Clear').click();
    });

    it('should close an open dropdown when clicking outside of it TC-021', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible');

      cy.get('.MuiBackdrop-root').last().click({ force: true });

      cy.get('[role="listbox"]').should('not.exist');
    });

    // ── Filter Combination & Interaction ──────────────────────────────────

    it('should apply Collection filter and show updated dashboard charts TC-010', () => {
      getTeamDropdown().click();

      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Task Status Breakdown').should('be.visible');
      cy.contains('Task Aging Breakdown').should('be.visible');

      cy.contains('button', 'Clear').click();
    });

    it('should remain functional after rapid Department filter changes TC-023', () => {
      getTeamDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();
      cy.contains('button', 'Clear').click();

      getTeamDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();
      cy.contains('button', 'Clear').click();

      getTeamDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('All Departments').click();

      cy.contains('Team Dashboard Overview').should('be.visible');
      cy.contains('Task Status Breakdown').should('be.visible');
    });

    // ── Collection Sub-filter Selection ───────────────────────────────────

    it('should allow selecting a G Dept option under Collection department', () => {
      // Collection → G Dept: KHOUN
      getTeamDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Select G Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .contains('KHOUN').click();

      cy.contains('KHOUN').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    it('should allow selecting a Collection Unit option after G Dept is selected', () => {
      // Collection → G Dept: KHOUN → Collection Unit: PAE
      getTeamDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Select G Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('KHOUN').click();

      cy.contains('Select Unit').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .contains('PAE').click();

      cy.contains('PAE').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    it('should allow selecting a Collection TL option after Collection Unit is selected', () => {
      // Collection → G Dept: KHOUN → Unit: PAE → TL: JO
      getTeamDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Select G Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('KHOUN').click();

      cy.contains('Select Unit').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('PAE').click();

      cy.contains('Select TL').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .contains('JO').click();

      cy.contains('JO').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    it('should allow selecting a Collection option after all upstream filters are set', () => {
      // Full Collection chain: Collection → KHOUN → PAE → JO → Collection: JO
      getTeamDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Collection').click();

      cy.contains('Select G Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('KHOUN').click();

      cy.contains('Select Unit').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('PAE').click();

      cy.contains('Select TL').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('JO').click();

      cy.contains('Select Collection').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .contains('JO').click();

      cy.contains('Task Status Breakdown').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    // ── Sales Sub-filter Selection ─────────────────────────────────────────

    it('should show G Department, Department, Branch, Unit, Mini Unit placeholders when Sales is selected', () => {
      getTeamDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      cy.contains('Select G Dept').should('be.visible');
      cy.contains('Select Dept').should('be.visible');
      cy.contains('Select Branch').should('be.visible');
      cy.contains('Select Unit').should('be.visible');
      cy.contains('Select Mini Unit').should('be.visible');

      cy.contains('button', 'Clear').click();
    });

    it('should allow selecting a G Department option under Sales department', () => {
      // Sales → G Department: TAY
      getTeamDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      cy.contains('Select G Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .contains('TAY').click();

      cy.contains('TAY').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    it('should allow selecting a Department option under Sales after G Department is set', () => {
      // Sales → G Department: TAY → Department: MIK
      getTeamDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      cy.contains('Select G Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('TAY').click();

      cy.contains('Select Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .contains('MIK').click();

      cy.contains('MIK').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    it('should allow selecting a Branch option under Sales after Department is set', () => {
      // Sales → G Department: TAY → Department: MIK → Branch: Attapue
      getTeamDropdown().click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('Sales').click();

      cy.contains('Select G Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('TAY').click();

      cy.contains('Select Dept').click();
      cy.get('[role="listbox"], .MuiPopover-root').last().contains('MIK').click();

      getFilterDropdown(/^Branch$/i).click();
      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible')
        .contains('Attapue').click();

      cy.contains('Attapue').should('be.visible');
      cy.contains('Task Status Breakdown').should('be.visible');
      cy.contains('button', 'Clear').click();
    });

    // ── Smoke & Sanity ─────────────────────────────────────────────────────

    it('should load the filter section without errors after page load TC-025', () => {
      cy.contains('Team Dashboard Overview').should('be.visible');
      cy.contains('label', /^Team$/i).should('be.visible');
      getTeamDropdown()
        .should('be.visible')
        .click();

      cy.get('[role="listbox"], .MuiPopover-root').last().should('be.visible');
      cy.get('body').type('{esc}');
    });

  });
});
