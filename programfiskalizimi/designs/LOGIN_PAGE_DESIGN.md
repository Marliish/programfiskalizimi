# 🔐 Login Page Design - FiscalNext
**Designer:** Luna  
**Created:** 2026-02-23  
**Status:** Wireframe Complete - Ready for Development  
**Page:** Authentication (Login & Register)

---

## 🎯 Design Goals

1. **Simple & Fast** - Users should log in within 5 seconds
2. **Professional** - Builds trust for financial software
3. **Clear Error Handling** - Helpful error messages
4. **Responsive** - Works on all devices (mobile, tablet, desktop)
5. **Accessible** - Keyboard navigation, screen reader friendly

---

## 📐 Layout Structure

### Split Screen Layout (Desktop)

```
┌─────────────────────────────────────────────────────────┐
│                    │                                     │
│                    │                                     │
│    LEFT PANEL      │         RIGHT PANEL                │
│    (Branding)      │         (Login Form)               │
│                    │                                     │
│                    │                                     │
│                    │                                     │
└─────────────────────────────────────────────────────────┘
     40% width                 60% width
```

### Single Panel Layout (Mobile/Tablet)

```
┌───────────────────────────┐
│                           │
│     Logo + Branding       │
│                           │
│ ┌─────────────────────┐   │
│ │                     │   │
│ │    Login Form       │   │
│ │                     │   │
│ └─────────────────────┘   │
│                           │
│                           │
└───────────────────────────┘
```

---

## 🎨 Detailed Design Specification

### LEFT PANEL (Desktop Only)

**Background:**
- Gradient: Primary 600 → Primary 800 (top to bottom)
- Overlay: Subtle pattern or geometric shapes (optional)
- Alternative: Solid Primary 600

**Content (Centered, Vertically & Horizontally):**

1. **Logo** (Top 30% of panel)
   - FiscalNext logo
   - Width: 180px
   - White/light color
   - Margin bottom: 32px

2. **Hero Headline** (Middle 40%)
   - Text: "Fiscalization Made Simple"
   - Font size: 36px (H1)
   - Font weight: 700
   - Color: White
   - Line height: 1.2
   - Max width: 400px
   - Margin bottom: 16px

3. **Subheadline**
   - Text: "Complete POS solution for Albania & Kosovo"
   - Font size: 18px (Body LG)
   - Font weight: 400
   - Color: Primary 100 (light blue, 80% opacity)
   - Line height: 1.6
   - Max width: 400px
   - Margin bottom: 32px

4. **Feature List** (Bottom 30%)
   - Icon + Text pairs (stacked)
   - Gap: 16px
   - Icon size: 24px
   - Icon color: Primary 200
   - Text color: White
   - Font size: 14px
   
   Features to highlight:
   ```
   ✓ Real-time fiscalization
   ✓ Works offline
   ✓ Multi-location support
   ✓ Beautiful & fast
   ```

**Dimensions:**
- Width: 40% of screen
- Min width: 480px
- Background: Primary 600 (#2563EB)
- Padding: 64px

---

### RIGHT PANEL (Login Form)

**Background:**
- Color: White (#FFFFFF)
- Alternative: Gray 50 (#F9FAFB) for subtle contrast

**Container:**
- Max width: 440px
- Centered (horizontally & vertically)
- Padding: 48px 32px
- On mobile: Full width, padding 24px

---

### LOGIN FORM COMPONENTS

#### 1. Form Header

**Logo** (Mobile Only - since desktop has left panel)
- FiscalNext logo
- Height: 48px
- Margin bottom: 32px
- Center aligned

**Headline**
```
Text: "Welcome back"
Font size: 30px (H2)
Font weight: 700
Color: Gray 900
Margin bottom: 8px
```

**Subheadline**
```
Text: "Log in to your account to continue"
Font size: 14px (Body SM)
Color: Gray 600
Margin bottom: 32px
```

---

#### 2. Email Input Field

**Label**
```
Text: "Email address"
Font size: 14px
Font weight: 600
Color: Gray 700
Margin bottom: 8px
Display: block
```

**Input**
```
Type: email
Placeholder: "[email protected]"
Height: 48px (larger for easier input)
Padding: 12px 16px
Border: 1px solid Gray 300
Border radius: 6px
Font size: 14px
Background: White
Width: 100%

States:
  Default: Border Gray 300
  Hover: Border Gray 400
  Focus: Border Primary 500, Ring Primary 500 (3px shadow)
  Error: Border Error 500, Ring Error 500 (3px shadow)
  Filled: Background White, Border Gray 400
```

**Error Message** (if validation fails)
```
Text: "Please enter a valid email address"
Font size: 12px
Color: Error 600
Margin top: 6px
Icon: alert-circle (16px) next to text
```

**Margin bottom:** 20px

---

#### 3. Password Input Field

**Label**
```
Text: "Password"
Font size: 14px
Font weight: 600
Color: Gray 700
Margin bottom: 8px
Display: block
```

**Input Container** (position: relative)
```
Input:
  Type: password (toggleable to text)
  Placeholder: "Enter your password"
  Height: 48px
  Padding: 12px 48px 12px 16px (right padding for icon)
  Border: 1px solid Gray 300
  Border radius: 6px
  Font size: 14px
  Background: White
  Width: 100%

Show/Hide Icon Button:
  Position: absolute, right 12px, top 50%
  Icon: eye (show) / eye-off (hide)
  Size: 20x20px
  Color: Gray 500
  Cursor: pointer
  Hover: Color → Gray 700
  No background, just icon
```

**Error Message** (if validation fails)
```
Text: "Password must be at least 8 characters"
Font size: 12px
Color: Error 600
Margin top: 6px
Icon: alert-circle (16px)
```

**Margin bottom:** 20px

---

#### 4. Remember Me & Forgot Password Row

**Layout:** Flex row, space between, align center

**Left Side: Remember Me Checkbox**
```
Display: flex
Gap: 8px
Align items: center

Checkbox:
  Size: 20x20px
  Border: 2px solid Gray 300
  Border radius: 4px
  Cursor: pointer
  
  Checked state:
    Background: Primary 500
    Border: Primary 500
    Checkmark icon: White (16px)

Label:
  Font size: 14px
  Color: Gray 700
  Cursor: pointer
  User-select: none
```

**Right Side: Forgot Password Link**
```
Text: "Forgot password?"
Font size: 14px
Font weight: 600
Color: Primary 500
Hover: Color → Primary 600, Underline
Cursor: pointer
```

**Margin bottom:** 28px

---

#### 5. Login Button

```
Type: submit
Text: "Log in"
Width: 100%
Height: 48px
Background: Primary 500
Color: White
Font size: 14px
Font weight: 600
Border radius: 6px
Border: none
Cursor: pointer
Box shadow: 0 1px 2px rgba(0,0,0,0.05)

States:
  Default: Background Primary 500
  Hover: Background Primary 600, Box shadow sm
  Active: Background Primary 700
  Loading: 
    Background Primary 500
    Text: "Logging in..."
    Spinner icon (20px) left of text
    Cursor: not-allowed
  Disabled:
    Background Gray 300
    Color Gray 500
    Cursor: not-allowed

Transition: all 200ms ease-out
```

**Margin bottom:** 24px

---

#### 6. Divider (Optional)

```
Display: flex
Align items: center
Text align: center
Margin: 24px 0

Line (left & right):
  Height: 1px
  Background: Gray 200
  Flex: 1

Text (center):
  Padding: 0 16px
  Font size: 12px
  Color: Gray 500
  Text: "OR"
```

---

#### 7. Google Sign-In Button (Optional - Future)

```
Width: 100%
Height: 48px
Background: White
Border: 1px solid Gray 300
Border radius: 6px
Display: flex
Align items: center
Justify content: center
Gap: 12px
Font size: 14px
Font weight: 600
Color: Gray 700
Cursor: pointer

Google icon:
  Width: 20px
  Height: 20px

Hover:
  Background: Gray 50
  Border: Gray 400

Text: "Continue with Google"
```

**Margin bottom:** 24px

---

#### 8. Sign Up Prompt

```
Text align: center
Font size: 14px
Color: Gray 600
Margin top: 32px

Normal text: "Don't have an account? "
Link text: "Sign up"
Link color: Primary 500
Link font weight: 600
Link hover: Primary 600, Underline
```

---

## 📱 Responsive Behavior

### Desktop (1024px+)
- Split screen layout (40% left panel, 60% right panel)
- Form max-width: 440px, centered in right panel
- Large, spacious design

### Tablet (768px - 1023px)
- Single panel layout (no left branding panel)
- Logo at top of form
- Form max-width: 480px, centered
- Padding: 32px

### Mobile (< 768px)
- Single panel, full width
- Logo at top, smaller (40px height)
- Form padding: 24px 16px
- Input height: 48px (same, easy to tap)
- Button height: 48px
- Font sizes: Same (readability priority)

---

## 🎭 Interaction States & Animations

### Form Submission Flow

1. **User clicks "Log in"**
   - Button state → Loading
   - Button text → "Logging in..."
   - Spinner appears
   - Button disabled

2. **Success** (credentials valid)
   - Quick success animation (checkmark, 300ms)
   - Redirect to dashboard (fade transition)

3. **Error** (invalid credentials)
   - Shake animation on form (200ms)
   - Error alert appears above form:
     ```
     Background: Error 50
     Border: 1px solid Error 200
     Border left: 4px solid Error 500
     Padding: 12px 16px
     Border radius: 6px
     
     Icon: x-circle (Error 500, 20px)
     Text: "Invalid email or password. Please try again."
     Font size: 14px
     Color: Error 800
     
     Close button (x icon, top right)
     ```
   - Button returns to default state
   - Focus on email input

### Field Validation

**Real-time validation** (on blur or submit):
- Email: Check for valid email format
- Password: Check minimum 8 characters

**Invalid state:**
- Red border (Error 500)
- Red focus ring
- Error message below field

**Valid state:**
- Green border (Success 500) - subtle, 1px
- No message (or checkmark icon in input, right side)

---

## 🔒 Security Features (Visual)

### Password Strength Indicator (Optional - For Register)
```
Display: Below password input
Height: 4px
Border radius: 2px
Background: Gray 200

Strength levels:
  Weak: Width 33%, Background Error 500, Text "Weak"
  Medium: Width 66%, Background Warning 500, Text "Medium"
  Strong: Width 100%, Background Success 500, Text "Strong"

Text:
  Font size: 12px
  Color: Matches strength color
  Margin top: 6px
```

### Session Notification (After login)
```
Position: Top right of screen
Padding: 16px
Background: Success 50
Border: 1px solid Success 200
Border radius: 6px
Shadow: md
Max width: 320px

Icon: check-circle (Success 500, 20px)
Text: "Logged in successfully"
Font size: 14px
Color: Success 800

Auto-dismiss after 3 seconds (slide out right)
```

---

## ♿ Accessibility Considerations

### Keyboard Navigation
1. Tab order:
   - Email input
   - Password input
   - Show/hide password button
   - Remember me checkbox
   - Forgot password link
   - Login button
   - Sign up link

2. Focus indicators:
   - All interactive elements have visible focus ring (3px Primary 500)

3. Keyboard shortcuts:
   - Enter key → Submit form (from any input)
   - Escape key → Clear form (optional)

### Screen Reader Support
```html
<!-- Email input -->
<label for="email" class="sr-only">Email address</label>
<input 
  id="email" 
  type="email" 
  aria-required="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">
  <!-- Error message here -->
</span>

<!-- Password input -->
<label for="password" class="sr-only">Password</label>
<input 
  id="password" 
  type="password" 
  aria-required="true"
  aria-describedby="password-error"
/>
<button 
  aria-label="Toggle password visibility"
  aria-pressed="false"
>
  <!-- Eye icon -->
</button>

<!-- Login button -->
<button 
  type="submit"
  aria-busy="false"
  aria-label="Log in to your account"
>
  Log in
</button>
```

### ARIA Attributes
- `role="alert"` for error messages
- `aria-invalid="true"` on invalid inputs
- `aria-busy="true"` on loading button
- `aria-describedby` linking inputs to error messages

---

## 🎨 Visual Hierarchy

### Color Usage
- **Primary (Blue):** CTA button, links, focused inputs
- **Gray:** Text, borders, secondary elements
- **Error (Red):** Validation errors, error messages
- **Success (Green):** Successful validation (subtle)
- **White:** Background, input backgrounds

### Typography Hierarchy
1. **Most Important:** Form headline (30px, Bold)
2. **Important:** Input labels (14px, Semibold), Button text (14px, Semibold)
3. **Normal:** Input text (14px, Regular), Help text (14px, Regular)
4. **Less Important:** Error messages (12px), Sign up prompt (14px)

### Spacing Hierarchy
- Large gaps: Between major sections (32px)
- Medium gaps: Between form fields (20px)
- Small gaps: Between label and input (8px)

---

## 📊 Example Measurements (Desktop)

```
Form Container:
  Max width: 440px
  Padding: 48px 32px

Elements:
  Logo: 48px height, margin-bottom 24px
  Headline: margin-bottom 8px
  Subheadline: margin-bottom 32px
  
  Input label: margin-bottom 8px
  Input field: height 48px, margin-bottom 20px
  Error message: margin-top 6px
  
  Remember row: margin-bottom 28px
  Login button: height 48px, margin-bottom 24px
  Sign up prompt: margin-top 32px

Total form height: ~600-650px (roughly)
```

---

## 🚀 Implementation Notes for Developers

### Tech Stack
- **Framework:** Next.js 14+
- **Styling:** Tailwind CSS
- **Form Validation:** react-hook-form + zod
- **Icons:** Lucide Icons

### File Structure
```
app/
  login/
    page.tsx          // Login page component
components/
  auth/
    LoginForm.tsx     // Login form component
    AuthLayout.tsx    // Split screen layout
lib/
  schemas/
    auth.ts           // Zod validation schemas
```

### Sample Zod Schema
```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
```

### State Management
```typescript
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [showPassword, setShowPassword] = useState(false)
```

### Error Handling
- Network errors: "Unable to connect. Please check your internet."
- Invalid credentials: "Invalid email or password. Please try again."
- Server errors: "Something went wrong. Please try again later."
- Too many attempts: "Too many login attempts. Please try again in 5 minutes."

---

## ✅ Design Checklist

Before marking as complete:
- [ ] All measurements specified
- [ ] All colors from design system
- [ ] All font sizes from design system
- [ ] All spacing uses 8px grid
- [ ] Hover states defined
- [ ] Focus states defined
- [ ] Error states defined
- [ ] Loading states defined
- [ ] Responsive breakpoints defined
- [ ] Accessibility attributes specified
- [ ] Keyboard navigation defined
- [ ] Touch targets ≥ 48px

**Status:** ✅ All checked - Ready for development

---

## 🎯 Next Designs

After login page:
1. Dashboard layout (Admin)
2. POS interface (Main screen)
3. Product catalog page
4. Settings page
5. Mobile app screens

---

**Designer:** Luna  
**Date:** 2026-02-23  
**Version:** 1.0  
**Status:** Complete & Ready for Development ✅
