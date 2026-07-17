from pydantic import BaseModel, Field


class SSOProviderConfig(BaseModel):
    """Internal domain representation — may carry the raw secret. Never return this directly from an endpoint."""

    id: str = "default"
    provider_type: str
    issuer: str
    client_id: str
    client_secret: str | None = None
    redirect_uri: str
    enabled: bool = True
    claim_mapping: dict[str, str] = Field(default_factory=dict)


class SSOProviderConfigInput(BaseModel):
    """POST /sso/config request body. An empty/omitted client_secret keeps the previously stored one."""

    provider_type: str
    issuer: str
    client_id: str
    client_secret: str | None = None
    redirect_uri: str
    enabled: bool = True
    claim_mapping: dict[str, str] = Field(default_factory=dict)


class SSOProviderConfigPublic(BaseModel):
    """GET /sso/config response shape — redacted, safe to expose to any caller."""

    id: str
    provider_type: str
    issuer: str
    client_id: str
    redirect_uri: str
    enabled: bool
    claim_mapping: dict[str, str]
    has_client_secret: bool


class AccessMapping(BaseModel):
    id: str
    provider_id: str = "default"
    claim_name: str
    expected_value: str
    role: str
    allowed: bool = True
    description: str = ""


class AccessMappingInput(BaseModel):
    id: str | None = None
    claim_name: str
    expected_value: str
    role: str
    allowed: bool = True
    description: str = ""


class UserIdentity(BaseModel):
    provider_id: str
    subject: str
    email: str
    groups: list[str] = Field(default_factory=list)
    roles: list[str] = Field(default_factory=list)


class AccessPolicy(BaseModel):
    id: str
    name: str
    conditions: list[dict] = Field(default_factory=list)
    allow: bool
    role: str | None = None
    description: str = ""


class DemoModeConfig(BaseModel):
    enabled: bool = False
    default_email: str = ""
    allow_local_validation: bool = True


class SSOConfigResponse(BaseModel):
    provider: SSOProviderConfigPublic | None
    demo_mode: DemoModeConfig


class SSOValidateResponse(BaseModel):
    ready: bool
    reasons: list[str] = Field(default_factory=list)


class SSOLoginRequest(BaseModel):
    email: str


class SSOLoginResponse(BaseModel):
    granted: bool
    role: str | None = None
    email: str | None = None
    reason: str | None = None
