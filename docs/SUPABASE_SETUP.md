# Going live on Supabase (phase 1)

Phase 1 is for **staff accounts only**: System Administrator, HR Director, HR Specialist,
Payroll Specialist and Finance Manager. Employee self-service is phase 2: run `supabase/002_portal.sql`, then create the employee's sign-in
in Authentication > Users (Auto Confirm) with the same email as the employee record. It links by email
automatically, or run `select public.link_employee('email','E-xxxx');`. Department managers come later.

## 1. Create the project
1. supabase.com > New project. Pick a region close to Egypt (for example Frankfurt) and a strong database password. Save it in your password manager.
2. Project Settings > API: copy the **Project URL** and the **anon public** key.
   Never share or commit the `service_role` key.

## 2. Create the tables
SQL Editor > New query > paste `supabase/001_init.sql` > Run.

## 3. Lock down sign-up
Authentication > Providers > Email: turn **off** "Allow new users to sign up".
Authentication > URL Configuration: set **Site URL** to the address where the app is hosted
(for example the GitHub Pages address). Invite and reset links return there.

## 4. Create the first administrator
1. Authentication > Users > Add user > Create new user. Enter email and password, tick Auto Confirm.
2. SQL Editor, run (change the email and name):

       update public.profiles set role = 'System Administrator', full_name = 'Your name'
       where id = (select id from auth.users where email = 'you@company.com');

## 5. Connect the app
Copy `config.example.json` to `config.json`, fill in the URL and anon key, then:

    python3 build.py
    git add config.json index.html && git commit -m "Connect to Supabase" && git push

(The anon key is meant to be public. Row level security is what protects the data.)

## 6. First sign-in
Open the app and sign in. If the browser holds data from the prototype, the app offers to
**upload it to the cloud**. Choose that once. After that, everyone sees the same data.

## 7. Add more staff
Authentication > Users > Invite user (or Add user). Then give them a role:

    update public.profiles set role = 'HR Specialist', full_name = 'Their name'
    where id = (select id from auth.users where email = 'them@company.com');

Roles: System Administrator, HR Director, HR Specialist, Payroll Specialist, Finance Manager.
A user with no role sees "Waiting for access" and cannot read anything.

## How saving works
* Every module is saved as one JSON document. Each save carries the version it started from.
* If someone else saved first, the second save is refused and the app asks you to reload.
  Nothing is overwritten silently.
* A pill in the sidebar shows: All changes saved, Saving, Offline, or Newer data is available.

## Before real payroll
* Turn on backups (Project Settings > Database > Backups). Daily backups need the Pro plan.
* Enter and approve the payroll rules with your accountant (Tax & Insurance).
* Add custom SMTP (for example your Outlook/Microsoft 365 mailbox) so invite emails are not rate limited.

## Phase 3: manage accounts inside the app (Users & Access)

1. SQL Editor: paste `supabase/003_admin.sql` and Run.
2. Edge Functions > Deploy a new function > Via Editor. Name it `admin-users`, paste
   `supabase/functions/admin-users/index.ts`, and Deploy. Keep "Verify JWT" on.
3. Sign in as HR Director or System Administrator and open Settings > Users & Access.
   Add an account (email + role + employee), hand over the temporary password shown once.
   The person chooses their own password at first sign-in.

## Phase 4: leave progress and emails

1. SQL Editor: paste `supabase/004_notify.sql` and Run. Employees can now see where each leave request stands.
2. Edge Functions > Deploy a new function > Via Editor, name it `notify-leave`, paste
   `supabase/functions/notify-leave/index.ts`, Deploy.
3. Edge Functions > Secrets (or Project Settings > Edge Functions > Secrets). Add ONE of these sets:
   - Gmail or any SMTP: `SMTP_HOST` (smtp.gmail.com), `SMTP_PORT` (465), `SMTP_USER`, `SMTP_PASS`
     (a Gmail app password, never the normal password), `MAIL_FROM` (for example `SMR HRMS <you@gmail.com>`).
   - Resend: `RESEND_API_KEY` and `MAIL_FROM` (needs a verified domain).
   Optional: `APP_URL` (the link inside the emails; default is the GitHub Pages address).
4. Who gets mail: a new request goes to the employee's line manager if that manager has an email in
   their employee record (or an account); otherwise to every active HR Director and HR Specialist.
   An approval or rejection goes to the employee. Each message is sent once (table `mail_log`).
