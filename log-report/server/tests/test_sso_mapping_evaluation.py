from app.models.sso import AccessMapping, UserIdentity
from app.services.access_evaluator import evaluate_access


def make_identity(**overrides) -> UserIdentity:
    defaults = dict(provider_id="default", subject="user-1", email="user@example.com", groups=[], roles=[])
    defaults.update(overrides)
    return UserIdentity(**defaults)


def make_mapping(**overrides) -> AccessMapping:
    defaults = dict(
        id="m1",
        provider_id="default",
        claim_name="email",
        expected_value="user@example.com",
        role="viewer",
        allowed=True,
        description="",
    )
    defaults.update(overrides)
    return AccessMapping(**defaults)


def test_claim_match_grants_role():
    identity = make_identity(email="admin@example.com")
    mapping = make_mapping(expected_value="admin@example.com", role="admin")

    policy = evaluate_access(identity, [mapping])

    assert policy.allow is True
    assert policy.role == "admin"


def test_claim_match_with_allowed_false_denies_explicitly():
    identity = make_identity(email="blocked@example.com")
    mapping = make_mapping(expected_value="blocked@example.com", allowed=False, description="known bad actor")

    policy = evaluate_access(identity, [mapping])

    assert policy.allow is False
    assert "known bad actor" in policy.description


def test_no_matching_mapping_denies_by_default():
    identity = make_identity(email="stranger@example.com")
    mapping = make_mapping(expected_value="someone-else@example.com")

    policy = evaluate_access(identity, [mapping])

    assert policy.allow is False
    assert policy.role is None
    assert policy.id == "default-deny"


def test_no_mappings_at_all_denies_by_default():
    policy = evaluate_access(make_identity(), [])

    assert policy.allow is False


def test_missing_required_attribute_denies_with_specific_reason():
    identity = make_identity(groups=[])
    mapping = make_mapping(claim_name="groups", expected_value="admins")

    policy = evaluate_access(identity, [mapping])

    assert policy.allow is False
    assert policy.id == "missing-attribute"
    assert "groups" in policy.description


def test_first_matching_mapping_wins_over_later_missing_attribute_mapping():
    identity = make_identity(email="user@example.com", groups=[])
    email_mapping = make_mapping(claim_name="email", expected_value="user@example.com", role="viewer")
    groups_mapping = make_mapping(id="m2", claim_name="groups", expected_value="admins", role="admin")

    policy = evaluate_access(identity, [email_mapping, groups_mapping])

    assert policy.allow is True
    assert policy.role == "viewer"
