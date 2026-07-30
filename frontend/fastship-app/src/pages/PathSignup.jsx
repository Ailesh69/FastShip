import SignupForm from '../components/SignupForm'
import {
  BoxIcon,
  LockIcon,
  MailIcon,
  PersonIcon,
  PinClusterIcon,
  PinIcon,
  UserIcon,
} from '../components/PixelIcons'

// Role sign-up screens. Every role renders the same <SignupForm /> and differs
// only in its title, field list and submit label — so field styling, card
// chrome and validation stay identical across all of them.

const CUSTOMER_FIELDS = [
  { name: 'username', label: 'USERNAME:', type: 'text', icon: UserIcon, autoComplete: 'username' },
  { name: 'email', label: 'EMAIL:', type: 'email', icon: MailIcon, autoComplete: 'email' },
  {
    name: 'password',
    label: 'PASSWORD:',
    type: 'password',
    icon: LockIcon,
    autoComplete: 'new-password',
  },
  {
    name: 'confirm',
    label: 'CONFIRM PASSWORD:',
    type: 'password',
    icon: LockIcon,
    autoComplete: 'new-password',
  },
]

const DELIVERY_FIELDS = [
  { name: 'name', label: 'NAME:', type: 'text', icon: PersonIcon, autoComplete: 'name' },
  { name: 'email', label: 'EMAIL:', type: 'email', icon: MailIcon, autoComplete: 'email' },
  {
    name: 'baseZip',
    label: 'BASE ZIP CODE:',
    type: 'text',
    icon: PinIcon,
    autoComplete: 'postal-code',
  },
  { name: 'capacity', label: 'MAX HANDLING CAPACITY:', type: 'text', icon: BoxIcon },
  // Multiple values in one row, kept as a comma-separated list so every field
  // stays the same height and border as the rest.
  {
    name: 'serviceZips',
    label: 'SERVICEABLE ZIP CODES:',
    type: 'text',
    icon: PinClusterIcon,
    placeholder: '10001, 10002',
  },
  {
    name: 'password',
    label: 'PASSWORD:',
    type: 'password',
    icon: LockIcon,
    autoComplete: 'new-password',
  },
  {
    name: 'confirm',
    label: 'CONFIRM PASSWORD:',
    type: 'password',
    icon: LockIcon,
    autoComplete: 'new-password',
  },
]

const SELLER_FIELDS = [
  { name: 'name', label: 'NAME:', type: 'text', icon: PersonIcon, autoComplete: 'name' },
  { name: 'email', label: 'EMAIL:', type: 'email', icon: MailIcon, autoComplete: 'email' },
  { name: 'zip', label: 'ZIP CODE:', type: 'text', icon: PinIcon, autoComplete: 'postal-code' },
  {
    name: 'password',
    label: 'PASSWORD:',
    type: 'password',
    icon: LockIcon,
    autoComplete: 'new-password',
  },
  {
    name: 'confirm',
    label: 'CONFIRM PASSWORD:',
    type: 'password',
    icon: LockIcon,
    autoComplete: 'new-password',
  },
]

const ROLE_FORMS = {
  client: {
    title: 'CUSTOMER SIGNUP',
    fields: CUSTOMER_FIELDS,
    submitLabel: '[ CREATE ACCOUNT ]',
  },
  partner: {
    title: 'DELIVERY PARTNER SIGNUP',
    fields: DELIVERY_FIELDS,
    submitLabel: '[ SIGN UP ]',
  },
  seller: {
    title: 'SELLER SIGNUP',
    fields: SELLER_FIELDS,
    submitLabel: '[ SIGN UP ]',
  },
}

function PathSignup({ role: roleKey }) {
  const role = ROLE_FORMS[roleKey]

  if (role) {
    return (
      <SignupForm
        title={role.title}
        fields={role.fields}
        submitLabel={role.submitLabel}
      />
    )
  }

  // Unknown role in the URL — every real path is covered by ROLES above.
  return (
    <section className="relative z-10 my-auto flex flex-col items-center px-4 text-center">
      <h1 className="title-glow m-0 text-[40px] leading-none">UNKNOWN PATH</h1>
      <p className="blink m-0 mt-[30px] text-[12px] leading-none text-fs-teal">
        PICK A ROLE FROM SELECT YOUR PATH
      </p>
    </section>
  )
}

export default PathSignup
