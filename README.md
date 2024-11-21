# SmartCondo

A platform for managing condominiums and buildings, including features such as common area reservations, voting, announcements, and financial management.

## Rfs (Functional Requirements)
- [ ] It should be possible to register a user
- [ ] It should be possible to authenticate and log in
- [ ] It should be possible to view the profile of a logged-in user
- [ ] It should be possible to list the condominiums the user is registered in
- [ ] It should be possible for the user to register and manage common area reservations
- [ ] It should be possible to create and manage votes within the condominium
- [ ] It should be possible for residents to participate in votes
- [ ] It should be possible for the user to register and view important notifications
- [ ] It should be possible for the user to create and manage maintenance requests
- [ ] It should be possible for the condominium administrator to create and manage announcements and documents
- [ ] It should be possible for the condominium administrator to register and manage employees
- [ ] It should be possible for the administrator to generate financial reports of the condominium
- [ ] It should be possible to register and manage visitors
- [ ] It should be possible to register and manage the condominium's infrastructure (e.g., pool, party room)

## Rns (Business Rules)
- [ ] The user should not be able to register with a duplicate email
- [ ] The administrator must validate all common area reservations before confirming them
- [ ] A user cannot reserve more than one common area at the same time
- [ ] Votes can only be created by administrators
- [ ] A user cannot vote more than once in a voting session
- [ ] Maintenance requests must be validated and prioritized by the administrator
- [ ] The administrator can manage shared announcements and documents
- [ ] The administrator can register and remove condominium employees
- [ ] The creation of visitors must be validated by the responsible resident
- [ ] Access control (entry and exit of residents, visitors, and employees) must be logged and validated

## RNFs (Non-Functional Requirements)
- [ ] User passwords must be encrypted
- [ ] Application data must be persisted in a NoSQL database (e.g., MongoDB)
- [ ] All data lists (users, reservations, votes) must be paginated with 20 items per page
- [ ] The system must use authentication via JWT (JSON Web Token)
- [ ] The system must be responsive and optimized for various devices (desktop, tablet, mobile)
- [ ] The system must ensure high availability and be scalable to handle large amounts of users and data