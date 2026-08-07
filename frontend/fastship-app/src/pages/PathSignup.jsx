import SignupForm from '../components/SignupForm'
import { registerUser } from '../api/auth'
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
// only in its title, field list, submit label and the shape of the payload its
// /register endpoint expects — so field styling, card chrome and shared
// validation stay identical across all of them.

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

// Zip codes and capacities are INTEGER columns on the backend, so they are
// parsed here rather than posted as the strings the inputs hold.
const DIGITS = /^\d+$/

const zipList = (raw) =>
  raw
    .split(',')
    .map((z) => z.trim())
    .filter(Boolean)

const badZips = (raw) => zipList(raw).some((z) => !DIGITS.test(z))

const ROLE_FORMS = {
  client: {
    title: 'CUSTOMER SIGNUP',
    fields: CUSTOMER_FIELDS,
    submitLabel: '[ CREATE ACCOUNT ]',
    // The form calls it USERNAME; ClientCreate calls it name.
    toPayload: (v) => ({
      name: v.username.trim(),
      email: v.email.trim(),
      password: v.password,
    }),
  },
  partner: {
    title: 'DELIVERY PARTNER SIGNUP',
    fields: DELIVERY_FIELDS,
    submitLabel: '[ SIGN UP ]',
    toPayload: (v) => ({
      name: v.name.trim(),
      email: v.email.trim(),
      password: v.password,
      zipcode: Number(v.baseZip.trim()),
      max_handling_capacity: Number(v.capacity.trim()),
      serviceable_zip_codes: zipList(v.serviceZips).map(Number),
    }),
    validate: (v) => {
      const e = {}
      if (v.baseZip.trim() && !DIGITS.test(v.baseZip.trim())) e.baseZip = 'DIGITS ONLY'
      if (v.capacity.trim() && !DIGITS.test(v.capacity.trim())) e.capacity = 'DIGITS ONLY'
      else if (v.capacity.trim() && Number(v.capacity) < 1) e.capacity = 'MUST BE AT LEAST 1'
      if (v.serviceZips.trim() && badZips(v.serviceZips))
        e.serviceZips = 'COMMA-SEPARATED ZIP CODES, DIGITS ONLY'
      return e
    },
  },
  seller: {
    title: 'SELLER SIGNUP',
    fields: SELLER_FIELDS,
    submitLabel: '[ SIGN UP ]',
    toPayload: (v) => ({
      name: v.name.trim(),
      email: v.email.trim(),
      password: v.password,
      zipcode: Number(v.zip.trim()),
    }),
    validate: (v) => {
      const e = {}
      if (v.zip.trim() && !DIGITS.test(v.zip.trim())) e.zip = 'DIGITS ONLY'
      return e
    },
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
        validateFields={role.validate}
        onSubmit={(values) => registerUser(role.toPayload(values), roleKey)}
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
