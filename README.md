# SmartCondo

A platform for managing condominiums and buildings, including features such as common area reservations, voting, announcements, and financial management.

## Rfs (Functional Requirements)
- [x] It should be possible to register a user
- [x] It should be possible to authenticate and log in
- [x] It should be possible to view the profile of a logged-in user
- [x] It should be possible to list the condominiums the user is registered in
- [x] It should be possible for the user to register and manage common area reservations
- [x] It should be possible to create and manage votes within the condominium
- [x] It should be possible for residents to participate in votes
- [ ] It should be possible for the user to notifications - partially done (front-end is missing)
- [x] It should be possible for the user to create and manage maintenance requests
- [ ] It should be possible for the condominium administrator to create and manage announcements and documents
- [ ] It should be possible for the condominium administrator to register and manage employees
- [ ] It should be possible for the administrator to generate financial reports of the condominium
- [ ] It should be possible to register and manage visitors
- [ ] It should be possible to register and manage the condominium's infrastructure (e.g., pool, party room)
- [ ] It should be possible to manage and track service requests for maintenance
- [ ] It should be possible to create and manage community events

## Rns (Business Rules)
- [x] The user should not be able to register with a duplicate email
- [x] A user cannot reserve more than one common area at the same time
- [x] Polls can only be created by administrators
- [x] A user cannot vote more than once in a voting session
- [ ] The administrator can manage shared announcements and documents
- [ ] The administrator can register and remove condominium employees
- [ ] The creation of visitors must be validated by the responsible resident
- [ ] Access control (entry and exit of residents, visitors, and employees) must be logged and validated
- [ ] The administrator must ensure that all community events are approved before being published

## RNFs (Non-Functional Requirements)
- [x] User passwords must be encrypted
- [x] Application data must be persisted in PostgreSQL
- [x] All data lists (users, reservations, votes) must be paginated with 20 items per page
- [x] The system must use authentication via JWT (JSON Web Token)
- [ ] The system must be responsive and optimized for various devices (desktop, tablet, mobile)
- [ ] The system must ensure high availability and be scalable to handle large amounts of users and data
- [ ] The system must provide real-time notifications for important updates