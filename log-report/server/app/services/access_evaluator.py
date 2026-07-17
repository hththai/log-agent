from app.models.sso import AccessMapping, AccessPolicy, UserIdentity

_DEFAULT_DENY = AccessPolicy(
    id="default-deny",
    name="No matching access mapping",
    allow=False,
    description="No access mapping matched this identity",
)


def _claim_values(identity: UserIdentity, claim_name: str) -> list[str] | None:
    """Resolve a mapping's claim_name to the identity's values for it.

    Returns None when the identity carries no data at all for that claim
    (the "missing required attribute" edge case, FR-005) — as opposed to an
    empty/non-matching value, which is just a normal non-match.
    """
    if claim_name == "email":
        return [identity.email] if identity.email else None
    if claim_name == "subject":
        return [identity.subject] if identity.subject else None
    if claim_name == "groups":
        return identity.groups or None
    if claim_name == "roles":
        return identity.roles or None
    return None


def evaluate_access(identity: UserIdentity, mappings: list[AccessMapping]) -> AccessPolicy:
    """Evaluate an identity against configured access mappings.

    Denies by default (FR-005, SC-003): access is only granted when a
    mapping's claim/value matches and is marked allowed. The first matching
    mapping wins; a mapping matching with allowed=False produces an explicit
    denial rather than falling through to the default-deny reason.
    """
    missing_claim: str | None = None

    for mapping in mappings:
        values = _claim_values(identity, mapping.claim_name)
        if values is None:
            if missing_claim is None:
                missing_claim = mapping.claim_name
            continue
        if mapping.expected_value not in values:
            continue

        if mapping.allowed:
            return AccessPolicy(
                id=mapping.id,
                name=mapping.description or f"{mapping.claim_name}={mapping.expected_value}",
                conditions=[{"claim_name": mapping.claim_name, "expected_value": mapping.expected_value}],
                allow=True,
                role=mapping.role,
                description=mapping.description,
            )
        return AccessPolicy(
            id=mapping.id,
            name=mapping.description or f"{mapping.claim_name}={mapping.expected_value}",
            conditions=[{"claim_name": mapping.claim_name, "expected_value": mapping.expected_value}],
            allow=False,
            description=f"Access denied by mapping rule: {mapping.description or mapping.role}",
        )

    if missing_claim is not None:
        return AccessPolicy(
            id="missing-attribute",
            name="Missing required attribute",
            allow=False,
            description=f"Identity is missing the '{missing_claim}' attribute required for access mapping",
        )

    return _DEFAULT_DENY
