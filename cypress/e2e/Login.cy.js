/// <reference types="cypress" />

describe('LALCO Collection Management - Login Page Component Test Suite', () => {
  const LOGIN_URL = 'http://54.255.136.172/#/login';
  const FORGOT_PASSWORD_URL = 'http://54.255.136.172/#/forgot-password';
  const API_LOGIN = '**/api/login';

  // Component Selectors
  const selectors = {
    // Branding & Header
    logo: 'img[alt="LALCO logo"]',
    title: 'h1.MuiTypography-h4',
    subtitle: 'h1 + p',
    langSwitch: '[role="switch"]',
    card: '.MuiPaper-root',

    // Form & Inputs
    form: 'form',
    emailInput: '#email',
    emailLabel: '#email-label',
    emailHelper: '#email-helper-text',
    passwordInput: '#password',
    passwordLabel: '#password-label',
    passwordHelper: '#password-helper-text',
    passwordToggleBtn: '.MuiInputAdornment-root button',
    visibilityIcon: 'svg[data-testid="VisibilityIcon"]',
    visibilityOffIcon: 'svg[data-testid="VisibilityOffIcon"]',

    // Actions & Options
    rememberMeCheckbox: 'input[type="checkbox"]',
    rememberMeLabel: 'label.MuiFormControlLabel-root',
    forgotPasswordBtn: 'button.MuiLink-root',
    submitBtn: 'button[type="submit"]',

    // Feedback & Alerts
    alertBanner: '[role="alert"]',
    alertMessage: '.MuiAlert-message',
    alertIcon: 'svg[data-testid="ErrorOutlineIcon"]',
  };

  beforeEach(() => {
    // Clear storage and cookies for a clean slate
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit(LOGIN_URL);
    // Ensure the login form is rendered
    cy.get(selectors.form).should('be.visible');
  });

  // ==========================================
  // 1. UI & Visual Component Verification
  // ==========================================
  describe('1. UI & Visual Components Verification', () => {
    it('should display the LALCO brand logo with correct properties', () => {
      cy.get(selectors.logo)
        .should('be.visible')
        .and('have.attr', 'src')
        .and('include', 'data:image/png;base64');
    });

    it('should display the page title and subtitle in English by default', () => {
      cy.get(selectors.title)
        .should('be.visible')
        .and('have.text', 'Collection Management');

      cy.get(selectors.subtitle)
        .should('be.visible')
        .and('have.text', 'Sign in to your account');
    });

    it('should display the language switcher in the header', () => {
      cy.get(selectors.langSwitch)
        .should('be.visible')
        .and('have.attr', 'aria-label')
        .and('include', 'English');
    });

    it('should render the email input field with label and required attribute', () => {
      cy.get(selectors.emailLabel)
        .should('be.visible')
        .and('contain.text', 'Email Address');
      cy.get(selectors.emailInput)
        .should('be.visible')
        .and('have.attr', 'type', 'email')
        .and('have.attr', 'required');
    });

    it('should render the password input field with label and required attribute', () => {
      cy.get(selectors.passwordLabel)
        .should('be.visible')
        .and('contain.text', 'Password');
      cy.get(selectors.passwordInput)
        .should('be.visible')
        .and('have.attr', 'type', 'password')
        .and('have.attr', 'required');
    });

    it('should render the password visibility toggle icon button', () => {
      cy.get(selectors.passwordToggleBtn)
        .should('be.visible')
        .find(selectors.visibilityIcon)
        .should('exist');
    });

    it('should render the Remember Me checkbox unchecked by default', () => {
      cy.get(selectors.rememberMeLabel)
        .should('be.visible')
        .and('contain.text', 'Remember me');
      cy.get(selectors.rememberMeCheckbox)
        .should('exist')
        .and('not.be.checked');
    });

    it('should render the Forgot your password button link', () => {
      cy.get(selectors.forgotPasswordBtn)
        .should('be.visible')
        .and('have.text', 'Forgot your password?');
    });

    it('should render the Sign In submit button', () => {
      cy.get(selectors.submitBtn)
        .should('be.visible')
        .and('have.text', 'Sign In')
        .and('not.be.disabled');
    });
  });

  // ==========================================
  // 2. Input Field Interaction Tests
  // ==========================================
  describe('2. Input Field Interactions', () => {
    it('should auto-focus the email input field on initial load', () => {
      cy.focused().should('have.id', 'email');
    });

    it('should allow typing, reading, and clearing the email input', () => {
      const testEmail = 'user.test@lalco.la';
      cy.get(selectors.emailInput)
        .type(testEmail)
        .should('have.value', testEmail)
        .clear()
        .should('have.value', '');
    });

    it('should allow typing and clearing the password input in masked mode', () => {
      const testPass = 'SecretP@ssword123';
      cy.get(selectors.passwordInput)
        .type(testPass)
        .should('have.value', testPass)
        .and('have.attr', 'type', 'password')
        .clear()
        .should('have.value', '');
    });

    it('should toggle password visibility on and off when clicking the toggle icon', () => {
      const testPass = 'ToggleTest2026!';
      cy.get(selectors.passwordInput).type(testPass);

      // Initially masked
      cy.get(selectors.passwordInput).should('have.attr', 'type', 'password');
      cy.get(selectors.visibilityIcon).should('be.visible');

      // Click toggle -> should become visible (type="text")
      cy.get(selectors.passwordToggleBtn).click();
      cy.get(selectors.passwordInput)
        .should('have.attr', 'type', 'text')
        .and('have.value', testPass);
      cy.get(selectors.visibilityOffIcon).should('be.visible');

      // Click toggle again -> should return to masked (type="password")
      cy.get(selectors.passwordToggleBtn).click();
      cy.get(selectors.passwordInput)
        .should('have.attr', 'type', 'password')
        .and('have.value', testPass);
      cy.get(selectors.visibilityIcon).should('be.visible');
    });

    it('should toggle Remember Me checkbox state upon user click', () => {
      cy.get(selectors.rememberMeCheckbox)
        .should('not.be.checked')
        .check()
        .should('be.checked')
        .uncheck()
        .should('not.be.checked');
    });
  });

  // ==========================================
  // 3. Client-Side Form Validation Tests
  // ==========================================
  describe('3. Client-Side Form Validation', () => {
    it('should show error helper text on both fields when submitting an empty form', () => {
      cy.get(selectors.submitBtn).click();

      // Email field validation error
      cy.get(selectors.emailHelper)
        .should('be.visible')
        .and('have.text', 'Email is required');
      cy.get(selectors.emailInput).should('have.attr', 'aria-invalid', 'true');

      // Password field validation error
      cy.get(selectors.passwordHelper)
        .should('be.visible')
        .and('have.text', 'Password is required');
      cy.get(selectors.passwordInput).should('have.attr', 'aria-invalid', 'true');
    });

    it('should show password validation error when only email is filled', () => {
      cy.get(selectors.emailInput).type('user@example.com');
      cy.get(selectors.submitBtn).click();

      cy.get(selectors.emailHelper).should('not.exist');
      cy.get(selectors.passwordHelper)
        .should('be.visible')
        .and('have.text', 'Password is required');
    });

    it('should show email validation error when only password is filled', () => {
      cy.get(selectors.passwordInput).type('SomePassword123');
      cy.get(selectors.submitBtn).click();

      cy.get(selectors.passwordHelper).should('not.exist');
      cy.get(selectors.emailHelper)
        .should('be.visible')
        .and('have.text', 'Email is required');
    });

    it('should clear validation errors dynamically when the user starts typing', () => {
      // Trigger errors
      cy.get(selectors.submitBtn).click();
      cy.get(selectors.emailHelper).should('be.visible');
      cy.get(selectors.passwordHelper).should('be.visible');

      // Type in email -> email helper disappears
      cy.get(selectors.emailInput).type('a');
      cy.get(selectors.emailHelper).should('not.exist');
      cy.get(selectors.passwordHelper).should('be.visible');

      // Type in password -> password helper disappears
      cy.get(selectors.passwordInput).type('b');
      cy.get(selectors.passwordHelper).should('not.exist');
    });
  });

  // ==========================================
  // 4. Server-Side Authentication & Error Feedback
  // ==========================================
  describe('4. Server Authentication & Error Handling', () => {
    it('should display an alert banner when submitting invalid credentials', () => {
      cy.intercept('POST', API_LOGIN).as('loginRequest');

      cy.get(selectors.emailInput).type('unregistered@lalco.la');
      cy.get(selectors.passwordInput).type('WrongPassword999');
      cy.get(selectors.submitBtn).click();

      // Submit button should enter loading state
      cy.get(selectors.submitBtn)
        .should('contain.text', 'Signing in...')
        .and('be.disabled');

      // Wait for the backend response
      cy.wait('@loginRequest').its('response.statusCode').should('eq', 401);

      // Verify server error alert banner
      cy.get(selectors.alertBanner)
        .should('be.visible')
        .within(() => {
          cy.get(selectors.alertIcon).should('be.visible');
          cy.get(selectors.alertMessage)
            .should('have.text', 'Invalid login credentials. Please check and try again.');
        });

      // Submit button should restore
      cy.get(selectors.submitBtn)
        .should('contain.text', 'Sign In')
        .and('not.be.disabled');

      // URL should remain on login
      cy.hash().should('include', 'login');
    });

    it('should submit credentials when pressing Enter key in the password field', () => {
      cy.intercept('POST', API_LOGIN).as('loginRequest');

      cy.get(selectors.emailInput).type('test.enter@lalco.la');
      cy.get(selectors.passwordInput).type('TestPass123{enter}');

      cy.wait('@loginRequest');
      cy.get(selectors.alertBanner).should('be.visible');
    });
  });

  // ==========================================
  // 5. Navigation & Route Redirection
  // ==========================================
  describe('5. Navigation & External Links', () => {
    it('should navigate to the Forgot Password page when clicking the forgot password button', () => {
      cy.get(selectors.forgotPasswordBtn).click();

      // Verify route change
      cy.hash().should('include', 'forgot-password');
      cy.contains('Forgot Password').should('be.visible');
      cy.contains("Enter your email address and we'll send you a verification code").should('be.visible');

      // Verify return to login page link works
      cy.contains('button', 'Back to Login').click();
      cy.hash().should('include', 'login');
      cy.get(selectors.form).should('be.visible');
    });
  });

  // ==========================================
  // 6. Language Switcher (i18n) Component
  // ==========================================
  describe('6. Language Switcher (i18n)', () => {
    it('should toggle UI language between English and Lao', () => {
      // Switch from English to Lao
      cy.get(selectors.langSwitch).click();

      // Verify Lao translations
      cy.get(selectors.title).should('have.text', 'ການຈັດການເກັບເງິນ');
      cy.get(selectors.subtitle).should('have.text', 'ເຂົ້າສູ່ລະບົບບັນຊີຂອງທ່ານ');
      cy.get(selectors.emailLabel).should('contain.text', 'ທີ່ຢູ່ອີເມວ');
      cy.get(selectors.passwordLabel).should('contain.text', 'ລະຫັດຜ່ານ');
      cy.get(selectors.rememberMeLabel).should('contain.text', 'ຈື່ຈຳຂ້ອຍ');
      cy.get(selectors.forgotPasswordBtn).should('have.text', 'ລືມລະຫັດຜ່ານບໍ?');
      cy.get(selectors.submitBtn).should('have.text', 'ເຂົ້າສູ່ລະບົບ');

      // Verify localStorage was updated to 'lo'
      cy.window().then((win) => {
        expect(win.localStorage.getItem('lalco_lang')).to.eq('lo');
      });

      // Switch back to English
      cy.get(selectors.langSwitch).click();

      // Verify English restored
      cy.get(selectors.title).should('have.text', 'Collection Management');
      cy.get(selectors.subtitle).should('have.text', 'Sign in to your account');
      cy.get(selectors.emailLabel).should('contain.text', 'Email Address');
      cy.get(selectors.passwordLabel).should('contain.text', 'Password');
      cy.get(selectors.submitBtn).should('have.text', 'Sign In');

      // Verify localStorage was updated to 'en'
      cy.window().then((win) => {
        expect(win.localStorage.getItem('lalco_lang')).to.eq('en');
      });
    });
  });

  // ==========================================
  // 7. Successful Authentication
  // ==========================================
  describe('7. Successful Authentication', () => {
    it('should successfully log in and redirect away from login page with valid credentials', () => {
      cy.intercept('POST', API_LOGIN).as('validLogin');

      cy.get(selectors.emailInput).type('eranda.h@lalco.la');
      cy.get(selectors.passwordInput).type('Eranda.h@1');
      cy.get(selectors.submitBtn).click();

      cy.wait('@validLogin').its('response.statusCode').should('eq', 200);

      // Verify redirection to the dashboard / authenticated view
      cy.hash().should('not.include', 'login');
    });
  });
});
