# SSO Configuration API Contract

## Overview

This contract defines the minimal configuration and access-control endpoints needed for the SSO feature.

## Endpoints

### GET /api/sso/config
Returns the active SSO configuration state that is safe to expose to the client.

### POST /api/sso/config
Stores or updates SSO provider configuration.

### GET /api/sso/mappings
Returns configured access mappings.

### POST /api/sso/mappings
Creates or updates an access mapping.

### POST /api/sso/validate
Validates a provider configuration and returns whether it is ready for sign-in.

### POST /api/sso/login
Starts or completes an SSO sign-in flow based on the configured provider.
