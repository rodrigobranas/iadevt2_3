
Coding Standards

All source code must be written in English.

These standards apply to our JS/TS backend (Node/Express) and frontend (Vite/React). Each guideline includes a brief example. Favor clarity, consistency, and testability.

1) Naming conventions
- Use camelCase for variables, functions, and methods.
- Use PascalCase for classes and interfaces.
- Use kebab-case for files and directories.

Bad
// file: userService.js
class userservice {}
function Create_User() {}

Good
// file: user-service.js
class UserService {}
function createUser() {}

2) Avoid abbreviations and overly long names
- Avoid unclear abbreviations.
- Keep names meaningful but concise (roughly under 30 characters).

Bad
const cfg = getUsrCfg();

Good
const userConfig = getUserConfig();

3) Replace magic numbers with named constants
- Declare constants/enums to convey intent.

Bad
if (retryCount > 3) throw new Error("Too many retries");

Good
const MAX_RETRY_COUNT = 3;
if (retryCount > MAX_RETRY_COUNT) throw new Error("Too many retries");

4) Functions do one clear thing and are named with a verb
- A function/method should perform a single, well-defined action.
- Names start with a verb, not a noun.

Bad
function userData(input) { /* mixes parse + validate + save */ }

Good
function parseUser(input) {}
function validateUser(user) {}
function saveUser(user) {}

5) Prefer ≤ 3 parameters; use an options object if needed

Bad
function createUser(firstName, lastName, email, role, isActive) {}

Good
type CreateUserOptions = {
	firstName: string;
	lastName: string;
	email: string;
	role?: string;
	isActive?: boolean;
};

function createUser(options: CreateUserOptions) {}

6) Avoid side effects in queries
- Separate commands (that change state) from queries (that return data).
- Queries must not change state.

Bad
function getUserAndIncrementViewCount(id: string) { /* reads and writes */ }

Good
function getUser(id: string) { /* read only */ }
function incrementUserViewCount(id: string) { /* write only */ }

7) Limit nesting; prefer early returns
- Never nest more than two if/else levels.
- Use early returns to reduce indentation.

Bad
function process(user?: User) {
	if (user) {
		if (user.isActive) {
			if (user.balance > 0) {
				return charge(user);
			} else {
				return notifyInsufficientBalance(user);
			}
		}
	}
}

Good
function process(user?: User) {
	if (!user) return;
	if (!user.isActive) return;
	if (user.balance <= 0) return notifyInsufficientBalance(user);
	return charge(user);
}

8) Do not use flag parameters
- Extract separate functions for distinct behaviors.

Bad
function sendReport(data: Report, isPdf: boolean) {
	return isPdf ? renderPdf(data) : renderHtml(data);
}

Good
function sendPdfReport(data: Report) {
	return renderPdf(data);
}
function sendHtmlReport(data: Report) {
	return renderHtml(data);
}

9) Keep methods short (≤ 50 lines)
- Split long methods into smaller, named helpers.

10) Keep classes small (≤ 300 lines)
- Split responsibilities into smaller classes/modules.

11) Invert dependencies for external resources (Dependency Inversion Principle)
- Depend on abstractions, not concretions.
- Inject dependencies in use cases and interface adapters.

Bad
class PaymentService {
	private client = new StripeClient(process.env.STRIPE_KEY!);
	charge(amount: number) {
		return this.client.charge(amount);
	}
}

Good
interface PaymentGateway {
	charge(amount: number): Promise<void>;
}

class StripeGateway implements PaymentGateway {
	constructor(private client: StripeClient) {}
	charge(amount: number) {
		return this.client.charge(amount);
	}
}

class PaymentService {
	constructor(private gateway: PaymentGateway) {}
	charge(amount: number) {
		return this.gateway.charge(amount);
	}
}

12) Minimize blank lines inside functions
- Use blank lines sparingly to separate logical sections, not between every statement.

Bad
function updateUser() {
	const user = getUser();

	user.name = "John";

	save(user);
}

Good
function updateUser() {
	const user = getUser();
	user.name = "John";
	save(user);
}

13) Prefer self-explanatory code over comments
- Favor clear names and small functions over explanatory comments.

Bad
// increase user balance by deposit amount
function upd(u, amt) { u.bal += amt; }

Good
function deposit(user: User, amount: number) {
	user.balance += amount;
}

14) One variable per line

Bad
let firstName = "John", lastName = "Doe";

Good
let firstName = "John";
let lastName = "Doe";

15) Declare variables close to their usage

Bad
let result: number;
// many lines…
result = calculateTotal(items);

Good
const result = calculateTotal(items);

16) Prefer composition over inheritance
- Compose behavior from small parts instead of deep class hierarchies.

Bad
class CsvReportGenerator extends BaseReportGenerator {
	// overrides many methods
}

Good
interface Formatter { format(data: unknown): string }
class CsvFormatter implements Formatter { format(data: unknown) { /* ... */ return ""; } }
class ReportGenerator {
	constructor(private formatter: Formatter) {}
	generate(data: unknown) { return this.formatter.format(data); }
}

Short checklist
- Names: camelCase (vars/functions), PascalCase (classes), kebab-case (files/dirs)
- Clear verbs for function names; one responsibility
- ≤ 3 params; prefer options objects
- No magic numbers; use constants/enums
- No side effects in queries
- Early returns; shallow nesting
- No flag params
- Small methods/classes
- DIP for external resources (inject abstractions)
- Minimal blank lines; minimal comments; one variable per line
- Declare variables near use
- Prefer composition