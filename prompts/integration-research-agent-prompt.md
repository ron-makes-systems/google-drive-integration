Could you help me with analyzing third-party service for Fibery integration development? Your goal is to research a target application's API and provide comprehensive, actionable information to help developers build Fibery integrations with this platform.

# Fibery Integrations API
Here's what Fibery Integrations API looks like. I hope it will help you to look for more relevant information:

Integrations in Fibery are quite unusual. It replicates a part of an external app domain and feed data into Fibery and create several Databases.

Dedicated service (integration application) should be implemented to configure and fetch data from an external application.

## How it works

All communication between integration application and Fibery services is done via standard hypertext protocols, whether it can be HTTP or HTTPS. All integration applications are expected to adhere to a particular API format as outlined in this documentation. The underlying technologies used to develop these integration applications are up to the individual developer.

Users may register their applications with Fibery by providing a HTTP or HTTPS URI for their service. The service must be accessible from the internet in order for the applications gallery to successfully communicate with the service.

> It is highly recommended that service providers consider utilizing HTTPS for all endpoints and limit access to these services only to IP addresses known to be from Fibery.

In essence, Fibery's applications gallery service acts as a proxy between other Fibery services and the third party provider with some added logic for account and filter storage and validation.

> In the interface, Type = Database, App = Space.

# Custom Integration Example
Integrations are ready-made services that make it simple to configure and customize specific processes.

In this article, we will show how to create simple integration app which does not require any authentication.

Let's imagine we intend to create a [public holidays app](https://gitlab.com/fibery-community/holidays-integration-app) which will sync data about holidays for selected countries. The holidays service [https://date.nager.at](https://date.nager.at/) will be used to retrieve holidays.

## **Getting Started**

The choice of underlying technologies used to develop integration applications is up to the individual developer. We are going to implement all required endpoints in web app step by step. We will use Node.js for implementing this integration app.

### **App configuration endpoint**

Every integration should have the configuration which describes what the app is doing and the authentication methods.

The app configuration should be accessible at **GET "/"** endpoint and should be publicly available. For example, we used Heroku to host the app.

This is the endpoint implementation:
```
const appConfig = require(`./config.app.json`);
app.get(`/`, (req, res) => res.json(appConfig));
```

This is how config.app.json looks like (all properties are required):
```
{
  "id": "holidays-app",
  "name": "Public Holidays",
  "version": "1.0.1",
  "description": "Integrate data about public holidays into Fibery",
  "authentication": [
    {
      "id": "public",
      "name": "Public Access",
      "description": "There is no any authentication required",
      "fields": []
    }
  ],
  "sources": [],
  "responsibleFor": {
    "dataSynchronization": true
  }
}
```

Since we don't want the app be authenticated, we didn't provide any fields for "Public Access" node in authentication.

### **Validate**

This endpoint is responsible for app account validation. It is required to be implemented. Let's just send back the name of account without any authentication since we are creating an app with public access.

POST /validate

```
app.post(`/validate`, (req, res) => res.json({name: `Public`}));
```

### **Sync configuration endpoint**

The way data is synchronised should be described.

The endpoint is **POST /api/v1/synchronizer/config**

```
const syncConfig = require(`./config.sync.json`);
app.post(`/api/v1/synchronizer/config`, (req, res) => res.json(syncConfig));
```

config.sync.json:

```
{
  "types": [
    {
      "id": "holiday",
      "name": "Public Holiday"
    }
  ],
  "filters": [
    {
      "id": "countries",
      "title": "Countries",
      "datalist": true,
      "optional": false,
      "type": "multidropdown"
    },
    {
      "id": "from",
      "type": "number",
      "title": "Start Year (by default previous year used)",
      "optional": true
    },
    {
      "id": "to",
      "type": "number",
      "title": "End Year (by default current year used)",
      "optional": true
    }
  ]
}
```
* The **types** are responsible for describing types which will be synced. For the holidays app it is just one type with id "holidays" and name "Public Holidays". It means that only one integration Fibery database will be created in the space, with the name "Public Holidays".
* The **filters** contain information on how the type can be filtered. In our case, there is a multi drop down ('countries') which is required and marked as data list. It means that options for this drop down should be retrieved from app and special end-point should be implemented for that. Also, we have two numeric filters from and to which are optional and can be used to filter holidays by years.

### **Datalist**

Endpoint POST /api/v1/synchronizer/datalist should be implemented if synchronizer filters has dropdown marked as "datalist": true. Since we have countries multi drop down which should contain countries it is required to implement the mentioned endpoint as well:
```
app.post(`/api/v1/synchronizer/datalist`, wrap(async (req, res) => {
    const countries = await (got(`https://date.nager.at/api/v3/AvailableCountries`).json());
    const items = countries.map((row) => ({title: row.name, value: row.countryCode}));
    res.json({items});
}));
```

> For this app, only the list of countries is returned since our config has only one data list. In the case where there are several data lists then we will need to retrieve "field" from request body which will contain an id of the requested list. The response should be formed as an array of items where every element contains title and value properties.

For example, part of countries response will look like this:
```
{ "items": [
   { "title": "Poland", "value": "PL"},
   { "title": "Belarus", "value": "BY"},
   { "title": "Cyprus", "value": "CY"}, 
   { "title": "Denmark", "value": "DK"},
   { "title": "Russia", "value": "RU"}
]}
```

### **Schema**

`POST /api/v1/synchronizer/schema` endpoint should return the data schema of the app. In our case it should contain only one root element "holiday" named after the id of holiday type in sync configuration above.

```
const schema = require(`./schema.json`);
app.post(`/api/v1/synchronizer/schema`, (req, res) => res.json(schema));

```

schema.json content can be found below

```
{
    "holiday": {
      "id": {
        "name": "Id",
        "type": "id"
      },
      "name": {
        "name": "Name",
        "type": "text"
      },
      "date": {
        "name": "Date",
        "type": "date"
      },
      "countryCode": {
        "name": "Country Code",
        "type": "text"
      }
    }
}
```

NOTE: Every schema type should have "id" and "name" defined.

### **Data**

`POST /api/v1/synchronizer/data` is the data endpoint is responsible for retrieving data. There is no paging needed in case of our app, so the data is returned according to selected countries and years interval.

```
app.post(`/api/v1/synchronizer/data`, wrap(async (req, res) => {
    const {requestedType, filter} = req.body;
    if (requestedType !== `holiday`) {
        throw new Error(`Only holidays database can be synchronized`);
    }
    if (_.isEmpty(filter.countries)) {
        throw new Error(`Countries filter should be specified`);
    }
    const {countries} = filter;
    const yearRange = getYearRange(filter);
    const items = [];
    for (const country of countries) {
        for (const year of yearRange) {
            const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
            console.log(url);
            (await (got(url).json())).forEach((item) => {
                item.id = uuid(JSON.stringify(item));
                items.push(item);
            });
        }
    }
    return res.json({items});
}));


```

The requestedType and filter can be retrieved from the request body.

The response should be returned as array in "items" element.

```
{ "items": [] }
```

## Testing custom integration app

It is recommended to create integration tests before adding your custom app to Fibery apps gallery. Check some tests created for holidays app below:
```javascript
const request = require(`supertest`);
const app = require(`./app`);
const assert = require(`assert`);
const _= require(`lodash`);

describe(`integration app suite`, function () {
    it(`should have the logo`, async () => {
        await request(app).get(`/logo`).expect(200).expect(`Content-Type`, /svg/);
    });

    it(`should have app config`, async () => {
        const {body: appConfig} = await request(app).get(`/`)
            .expect(200).expect(`Content-Type`, /json/);

        assert.equal(appConfig.name, `Public Holidays`);
        assert.match(appConfig.description, /public holidays/);
        assert.equal(appConfig.responsibleFor.dataSynchronization, true);
    });

    it(`should have validate end-point`, async () => {
        const {body: {name}} = await request(app).post(`/validate`)
            .expect(200).expect(`Content-Type`, /json/);
        assert.equal(name, `Public`);
    });

    it(`should have synchronization config`, async () => {
        const {body: {types, filters}} = await request(app).post(`/api/v1/synchronizer/config`)
            .expect(200).expect(`Content-Type`, /json/);
        assert.equal(types.length, 1);
        assert.equal(filters.length, 3);
    });

    it(`should have schema holidays type defined`, async () => {
        const {body: {holiday}} = await request(app).post(`/api/v1/synchronizer/schema`)
            .send().expect(200).expect(`Content-Type`, /json/);
        assert.deepEqual(holiday.id, {name: `Id`, type: `id`});
    });

    it(`should return data for CY`, async () => {
        const {body: {items}} = await request(app).post(`/api/v1/synchronizer/data`).send({
            requestedType: `holiday`,
            filter: {
                countries: [`CY`],
            }
        }).expect(200).expect(`Content-Type`, /json/);
        assert.equal(items.length > 0, true);
        const holiday = items[0];
        assert.equal(holiday.id.length > 0, true);
        assert.equal(holiday.name.length > 0, true);
    });

    it(`should return data for BY and 2020 year only`, async () => {
        const {body: {items}} = await request(app).post(`/api/v1/synchronizer/data`).send({
            requestedType: `holiday`,
            filter: {
                countries: [`BY`],
                from: 2020,
                to: 2020
            }
        }).expect(200).expect(`Content-Type`, /json/);
        assert.equal(items.length > 0, true);
        const holidaysOtherThan2020 = _.filter(items, (i) => new Date(i.date).getFullYear() !== 2020);
        assert.equal(holidaysOtherThan2020.length > 0, false);
    });

});
```

# Connector Config Definition

## **Connector schema**

Each connector (integration) must follow strict schema with the following structure:

```typescript
type AuthenticationType = "none" | "token" | "oauth2";

type ConnectorConfigAuthenticationField = {
  /** Display title for the field */
  title: string;
  /** Optional description */
  description?: string;
  /** Field type */
  type: "oauth" | "password" | "text";
  /** Unique field identifier */
  id: string;
};

type ConnectorConfigLinkField = {
  type: "link";
  value: string;
  description?: string;
  id: string;
  name: string;
};

type ConnectorConfigAuthentication = {
  /** Description of the authentication method */
  description: string;
  /** Display name. @example "OAuth" */
  name: string;
  /** Authentication type identifier */
  id: AuthenticationType;
  /** Authentication fields to collect from user */
  fields: Array<ConnectorConfigAuthenticationField | ConnectorConfigLinkField>;
  /** OAuth version if using OAuth */
  type?: "oauth2";
  /** OAuth provider name */
  provider?: string;
};

type Source = Record<string, unknown>;

export type ConnectorConfig = {
  /** Unique connector identifier @example "Chargebee"  */
  id: string;
  /** Connector display name */
  name: string;
  /** Version string */
  version: string;
  /** Connector type */
  type: string;
  /** Connector description */
  description: string;
  /** Available authentication methods */
  authentication: Array<ConnectorConfigAuthentication>;
  /** Legacy field, use empty array */
  sources: Array<Source>;
  /** Defines what capabilities this connector provides */
  responsibleFor: {
    /** User authentication capability */
    userAuthentication: boolean;
    /** Data providing capability */
    dataProviding: boolean;
    /** Data synchronization - connector will be visible in integrations list */
    dataSynchronization: boolean;
    /** Data import - connector will be visible in imports list */
    dataImport: boolean;
  };
};
```

## **Authentication**

Authentication model represents type of authentication in app.

If your app doesn't require authentication, add authentication with *id* = "none". In the case you can omit *fields*.

## **Authentication field**

Authentication field represents the field in account. So account that will send to API endpoints will consist of the authentication fields.

## **Filter**

In Fibery, you can configure a set of Filters for integration with other applications. This is useful when you want to reduce the amount of data for synchronization, for example:
* Data created or modified after the certain date.
* Data from certain repositories, channels, groups.
* Deleted or archived data.
* Etc.

Filter configuration includes following common Fields across different Filter types:

```typescript
type FilterBase = {
  /** Unique identifier */
  id: string;
  /** Display name */
  title: string;
  /** Indicates that user may leave Filter unset */
  optional?: boolean;
  /** Secured Filter values are not available for change by non-owner */
  secured?: boolean;
  /** Filter default value */
  defaultValue?: unknown;
};

type TextFilter = FilterBase & {
  type: 'text';
};

type NumberFilter = FilterBase & {
  type: 'number';
};

type DateFilter = FilterBase & {
  type: 'datebox';
};

type BoolFilter = FilterBase & {
  type: 'bool';
  defaultValue?: boolean;
};

type SingleSelectFilter = FilterBase & {
  type: 'list';
  /** Connector should provide available values via datalist endpoint */
  datalist: true;
  /** Array of IDs of other datalists this filter depends on @example ["group"] */
  datalist_requires?: string[];
};

type MultiSelectFilter = FilterBase & {
  type: 'multidropdown';
  /** Connector should provide available values via datalist endpoint */
  datalist: true;
  /** Array of IDs of other datalists this filter depends on @example ["group"] */
  datalist_requires?: string[];
};

type Filter = TextFilter | NumberFilter | DateFilter | BoolFilter | SingleSelectFilter | MultiSelectFilter;
```

#### Filter configuration sample

```typescript
const filters: Filter[] = [
  {
    id: "channels",
    title: "Channels",
    datalist: true,
    optional: false,
    secured: true,
    type: "multidropdown"
  },
  {
    id: "oldest",
    title: "Oldest Message",
    optional: false,
    type: "datebox"
  },
  {
    id: "excludeAppMessages",
    title: "Filter out APP messages",
    optional: true,
    type: "bool",
    defaultValue: false
  }
];
```

# REST Endpoints

Below are a list of the HTTP endpoints expected in an integration application.
* Required**
* `GET /`: returns app information
* `POST /validate`: performs validation of the account
* `POST /api/v1/synchronizer/config`: returns synchronizer configuration
* `POST /api/v1/synchronizer/schema`: returns synchronizer schema
* `POST /api/v1/synchronizer/data`: returns data
* Optional**
* `GET /logo`: returns an image/svg+xml representation of the application's logo
* `POST /api/v1/synchronizer/datalist`: returns possible options for filter fields
* `POST /api/v1/synchronizer/filter/validate`: performs filter fields validation
* `POST /api/v1/synchronizer/resource`: returns files those behind security wall

## **GET /**

GET "/" endpoint is the main one which returns information about the app.

Response example:
```
{
    "version": "1.0",  // string representing the version of your app
    "name": "My Super Application",  // title of the app
    "description": "All your base are belong to us!", // long description
    "authentication": [], // list of possible account authentication approaches
    "sources": [], // empty error
    "responsibleFor": { // app responsibility
        "dataSynchronization": true // indicates that app is responsible for data synchronization
    }
}
```
* Authentication Information**

The `authentication` object includes all account schema information. It informs the Fibery front-end how to build forms for the end-user to provide required account information. This property is required, even if your application does not require authentication. At least one authentication object must be provided within array.

In case when application doesn't require authentication, the `fields` array must be omitted.

*Important note:* if your app provides OAuth capabilities for authentication, the authentication identifiers *must* be `oauth` or `oauth2` for OAuth v1 and OAuth v2, respectively.

Only one authentication type per OAuth version is currently supported.
```
{
    "authentication": [
        {
            "id": "basic", // identifier
            "name": "Basic Authentication", // user-friendly title
            "description": "Just using a username and password", // description
            "fields": [  //list of fields to be filled
                {
                    "id": "username",  //field identifier
                    "title": "Username",  //friendly name
                    "description": "Your username, duh!",  //description
                    "type": "text",  //field type (text, password, number, etc.)
                    "optional": true,  // is this a optional field?
                },
                /* ... */
            ]
        }
    ]
}

```

## **POST /validate**

This endpoint performs account validation when setting up an account for the app and before any actions that uses the account.

```typescript
type AccountValidateRequest = {
  /** Authentication type identifier */
  id: string;
  /** Account field values to validate */
  fields: Record<string, unknown>;
};

type AccountValidateSuccessResponse = {
  /** Friendly name for the account */
  name: string;
  /** New access token (for OAuth refresh) */
  access_token?: string;
  /** Token expiration date (for OAuth refresh) */
  expire_on?: string;
};

type AccountValidateErrorResponse = {
  /** Error message */
  message: string;
};
```

Request example:
```typescript
const request: AccountValidateRequest = {
  id: "basic",
  fields: {
    username: "test_user",
    password: "test$user!"
  }
};
```

Success Response (HTTP 200):
```typescript
const response: AccountValidateSuccessResponse = {
  name: "Awesome Account"
};
```

Failure Response (HTTP 401):
```typescript
const error: AccountValidateErrorResponse = {
  message: "Your password is incorrect!"
};
```

### **Refresh Access Token**

This endpoint can also be used to refresh access tokens. The incoming payload includes refresh and access token, and optionally expiration datetime. Response should include new access token to override expired one.

Refresh Access Token Request:
```typescript
const refreshRequest: AccountValidateRequest = {
  id: "oauth2",
  fields: {
    access_token: "xxxx",
    refresh_token: "yyyy",
    expire_on: "2018-01-01"
  }
};
```

Response after token refresh:
```typescript
const refreshResponse: AccountValidateSuccessResponse = {
  name: "Awesome account",
  access_token: "new-access-token",
  expire_on: "2020-01-01"
};
```

## **POST /api/v1/synchronizer/config**

The endpoint returns information about synchronization possibilities based on input parameters. It instructs Fibery about:
* Available types
* Available filters
* Available functionalities

```typescript
type SynchronizerTypeMeta = {
  /** Type identifier */
  id: string;
  /** Display name */
  name: string;
  /** Whether this is the default type */
  default: boolean;
  /** Whether this type represents a user */
  isUser?: boolean;
};

type SynchronizerFilterMeta = {
  /** Filter identifier */
  id: string;
  /** Display title */
  title: string;
  /** Whether values should be fetched from datalist endpoint */
  datalist?: boolean;
  /** Secured filter values are not available for change by non-owner */
  secured?: boolean;
  /** Whether filter is optional */
  optional: boolean;
  /** Filter type */
  type: "bool" | "list" | "multidropdown" | "datebox" | "text" | "number";
  /** Array of filter IDs this filter depends on */
  datalist_requires?: Array<string>;
  /** Default value for the filter */
  defaultValue?: unknown;
};

type SynchronizerConfigRequest = {
  /** Optional account credentials */
  account?: Record<string, unknown>;
};

type SynchronizerConfigResponse = {
  /** Available types for synchronization */
  types: Array<SynchronizerTypeMeta>;
  /** Available filters */
  filters: Array<SynchronizerFilterMeta>;
  /** Configuration version */
  version: number;
};
```

Request example:
```typescript
const request: SynchronizerConfigRequest = {
  account: {
    token: "user-token"
  }
};
```

Response example:
```typescript
const response: SynchronizerConfigResponse = {
  types: [
    { id: "bug", name: "Bug", default: false },
    { id: "us", name: "User Story", default: true },
  ],
  filters: [
    {
      id: "modifiedAfter",
      title: "Modified After",
      optional: true,
      type: "datebox"
    }
  ],
  version: 1
};
```

## **POST /api/v1/synchronizer/schema**

Integration app must provide data schema in advance so Fibery will be able to create appropriate types and relations and then be able to maintain them.

It should provide a schema for all requested types. Each type must contain `name` and `id` field.

```typescript
type SynchronizerSchemaField = {
  /** Display name of the field */
  name: string;
  /** Field type */
  type: "id" | "text" | "date" | "number" | "array[text]";
  /** Field subtype for specialized fields */
  subType?:
    | "boolean"
    | "url"
    | "md"
    | "integer"
    | "html"
    | "multi-select"
    | "single-select"
    | "email"
    | "date-range"
    | "date-time-range"
    | "workflow"
    | "file"
    | "day"
    | "avatar"
    | "title"
    | "icon"
    | "location";
  /** Options for select and workflow fields */
  options?: Array<{
    /** Option name */
    name: string;
    /** Whether this is the default option */
    default?: boolean;
    /** Whether this is a final/terminal option (for workflows) */
    final?: boolean;
    /** Option color in hex format @example "#f2e2f4" */
    color?: string;
    /** Option icon (emoji or icon name) @example "laughing" */
    icon?: string;
    /** Workflow option type */
    type?: "Not started" | "Started" | "Finished";
  }>;
  /** Number/money/text formatting configuration */
  format?: {
    /** Format type @example "Money" | "Percent" | "Number" | "phone" */
    format?: string;
    /** Currency code for money format @example "EUR" */
    currencyCode?: string;
    /** Whether to show thousand separators */
    hasThousandSeparator?: boolean;
    /** Number of decimal places */
    precision?: number;
    /** Unit for number format @example "ea" */
    unit?: string;
  };
  /** Field order in UI */
  order?: number;
  /** Relation configuration */
  relation?: {
    /** Relation cardinality */
    cardinality: "many-to-one" | "many-to-many" | "one-to-one";
    /** Name of the field on source side */
    name: string;
    /** Field name of target side */
    targetName: string;
    /** Id of target type */
    targetType: string;
    /** Find relation by value from this field */
    targetFieldId: string;
    /** Relation kind - use "native" for relations to fibery/user */
    kind?: "native";
  };
  /** Post-processing functions to apply */
  postProcessingFunctions?: Array<{
    name: string;
    args?: Record<string, unknown>;
  }>;
};

type SynchronizerSchema = {
  [typeName: string]: {
    /** Required: ID field */
    id: SynchronizerSchemaField;
    /** Required: Name/title field */
    name: SynchronizerSchemaField;
    /** Additional fields */
    [fieldName: string]: SynchronizerSchemaField;
  };
};

type GetSynchronizerSchemaRequest = {
  /** Selected account credentials */
  account: Record<string, unknown>;
  /** Array of selected type IDs */
  types: Array<string>;
  /** Currently configured filter */
  filter?: Record<string, unknown>;
};
```

Request example:
```typescript
const request: GetSynchronizerSchemaRequest = {
  types: ["pullrequest", "repository"],
  filter: {
    owner: "fibery",
    repositories: ["fibery/core", "fibery/ui"]
  },
  account: {
    token: "token"
  }
};
```

Response example:
```typescript
const response: SynchronizerSchema = {
  repository: {
    id: {
      type: "id",
      name: "Id"
    },
    name: {
      type: "text",
      name: "Name"
    },
    url: {
      type: "text",
      name: "Original URL",
      subType: "url"
    }
  },
  pullrequest: {
    id: {
      type: "id",
      name: "Id"
    },
    name: {
      type: "text",
      name: "Name"
    },
    repositoryId: {
      type: "text",
      name: "Repository Id",
      relation: {
        cardinality: "many-to-one",
        name: "Repository",
        targetName: "Pull Requests",
        targetType: "repository",
        targetFieldId: "id"
      }
    }
  }
};
```

### **Relations**

The `relation` field creates a relation between entities in Fibery.

Repository will have following fields (example includes only relation fields):
* Pull Requests - Array

Pull Request will have following fields:
* Repository Id - string - this field will be hidden from end user
* Repository - Repository

Complete Example:
```
{
  "repository": {
    "id": {
      "type": "id",
      "name": "Id"
    },
    "name": {
      "type": "text",
      "name": "Name"
    },
    "url": {
      "type": "text",
      "name": "Original URL",
      "subType": "url"
    } 
  },
  "pullrequest": {
    "id": {
      "type": "id",
      "name": "Id"
    },
    "name": {
      "type": "text",
      "name": "Name"
    },
    "repositoryId": {
      "type": "text",
      "name": "Repository Id",
      "relation": {
        "cardinality": "many-to-one",
        "name": "Repository",
        "targetName": "Pull Requests",
        "targetType": "repository",
        "targetFieldId": "id"
      }
    }
  }
}
```

## **POST /api/v1/synchronizer/data**

Data endpoint performs actual data retrieving for the specified integration settings. Data retrieving is run for each type independently.

Data synchronization supports:
* pagination
* delta synchronization

```typescript
type SynchronizationDataType = "delta" | "full";

type SynchronizerPagination<P = unknown> = {
  /** Whether there are more pages available */
  hasNext: boolean;
  /** Configuration to pass in next page request */
  nextPageConfig?: P;
};

type SynchronizerDataRequest<P = unknown> = {
  /** Account credentials */
  account?: Record<string, unknown>;
  /** Currently fetching type */
  requestedType?: string;
  /** Currently configured filters */
  filter?: Record<string, unknown>;
  /** When last successful synchronization was run */
  lastSynchronizedAt?: string;
  /** Pagination settings from previous request */
  pagination?: P;
  /** Configuration version */
  version?: string;
  /** Array of selected type IDs */
  types?: Array<string>;
  /** Current integration schema */
  schema?: SynchronizerSchema;
};

type SynchronizerDataResponse<T = unknown, P = unknown> = {
  /** Array of fetched data rows */
  items: Array<Partial<T>>;
  /** Synchronization type */
  synchronizationType?: SynchronizationDataType;
  /** Pagination information */
  pagination?: SynchronizerPagination<P>;
};
```

Request example:
```typescript
const request: SynchronizerDataRequest = {
  requestedType: "pullrequest",
  types: ["repository", "pullrequest"],
  filter: {
    owner: "fibery",
    repositories: ["fibery/core", "fibery/ui", "fibery/apps-gallery"]
  },
  account: {
    token: "token"
  },
  pagination: {
    repositories: ["fibery/ui", "fibery/apps-gallery"]
  },
  lastSynchronizedAt: "2020-09-30T09:08:47.074Z",
  schema: {
    repository: {
      id: {
        name: "Id",
        type: "text"
      }
    }
  }
};
```

Response example:
```typescript
const response: SynchronizerDataResponse = {
  items: [
    {
      id: "PR_1231",
      name: "Improve performance"
    },
    {
      id: "PR_1232",
      name: "Fix bugs"
    }
  ],
  pagination: {
    hasNext: true,
    nextPageConfig: {
      repositories: ["fibery/apps-gallery"]
    }
  },
  synchronizationType: "full"
};
```

### **Errors**

If something goes wrong then integration app should respond with corresponding error HTTP status code and error message.

Sample of error about sync failure:
```
{
    "message": "Unable to fetch data."
}
```

But some errors can be fixed if try to fetch data later. In this case error body should include `tryLater` flag with value `true`. Fibery will retry this particular page later on.

Sample of error about limits
```
{
    "message": "Rate limits reached",
    "tryLater": true
}
```

## **GET /logo**

`OPTIONAL`

The `/logo` endpoint is used to provide a SVG representation of a connected application's logo. This endpoint is entirely optional. Valid responses are a HTTP 200 response with a `image/svg+xml` content type, a HTTP 204 (No Content) response if there is no logo, or a 302 redirect to another URI containing the logo. If no logo is provided, or an error occurs, the application will be represented with our default app logo.

## **POST /api/v1/synchronizer/datalist**

`OPTIONAL`
* Request**

The inbound payload includes:
* `types` - an array of selected type ids
* `account` - selected account
* `field` - name of requested field
* `dependsOn` - object that contains filter key-value pairs of dependant fields

Request body:
```
{
    "types": ["pullrequest", "branch"],
    "account": {
        "token": "token"
    },
    "field": "repository",
    "dependsOn": {
        "owner": "fibery"
    }
}

```

This endpoint performs retrieving datalists from filter fields that marked with `datalist` flag.
* Response**

The response from your API should include `items` that is a JSON-serialized list of name-value objects: The `title` in each object is what is displayed to the end-user for each value in a combobox and the `value` is what is stored with the filter and what will be passed with subsequent requests that utilize the user-created filter.

Response sample:
```
{
    "items": [
        {
            "title": "fibery/ui",
            "value": "124"
        },
        {
            "title": "fibery/core",
            "value": "125"
        }
    ]
}
```

## **POST /api/v1/synchronizer/filter/validate**

`OPTIONAL`

This endpoint performs filter validation. It can be useful when app doesn't know about what filter value looks like. For example, if your app receives sql query as filter you may want to check is that query is valid.

**Request**:

Request body contains:
* `types` - array of selected type ids
* `account` - account on behalf of data should be fetched
* `filter` - currently configured filters

Request example:
```
{
    "types": ["repository", "pullrequest"],
    "filter": {
        "owner": "fibery",
        "repositories": ["fibery/core", "fibery/ui", "fibery/apps-gallery"]
    },
    "account": {
        "token": "token"
    }
}

```

**Response**:

If the filter is valid, the app should return HTTP status 200 or 204.

If the account is invalid, the app should return HTTP status 400 (Bad request) with a simple JSON object containing an error message:

Error response sample:
```
{"message": "Your filter is incorrect!"}
```

## POST /api/v1/synchronizer/resource

`OPTIONAL`

This endpoint is used to access files that require authentication. For example, if the schema contains a `files` field and the files are not accessible by direct link then this route can be used to download files by specifying a url as `app://resource?url=:url&value=1`. As a result the route will be called with `url` and `value` params. The resource endpoint is called with all query parameters specified in `app://resource` url.

**Request**:

Request body contains:
* `types` - array of selected type ids
* `account` - account on behalf of data should be fetched
* `filter` - currently configured filters
* `params` - list of parameters.

**Response**:
File content as a stream

if your app provides OAuth capabilities for authentication, the authentication identifiers must be `oauth` and `oauth2` for OAuth v1 and OAuth v2, respectively. Only one authentication type per OAuth version is currently supported.

# OAuth

## **OAuth v2**

### **POST /oauth2/v1/authorize**

The `POST /oauth2/v1/authorize` endpoint performs the initial setup for OAuth version 2 accounts using `Authorization Code` grant type by generating `redirect_uri` based on received parameters.

Request body includes following parameters:
* `callback_uri` - is the redirect URL that the user should be expected to be redirected to upon successful authentication with the third-party service
* `state` - opaque value used by the client to maintain state between request and callback. This value should be included in `redirect_uri` to be able to complete OAuth flow by Fibery.

Request sample
```
{
  "callback_uri": "https://oauth-svc.fibery.io",
  "state": "xxxxxx"
}
```

Return body should include a `redirect_uri` that the user should be forwarded to in order to complete setup.\
Replies are then POST'ed to `/oauth2/v1/access_token` endpoint.

> The OAuth implementation requires the account identifier to be `oauth2` for OAuth version 2.
>
> If service provider has callback url whitelisting than `https://oauth-svc.fibery.io` has to be added to the whitelist.

Response example:
```
{
  "redirect_uri": "https://accounts.google.com/o/oauth2/token?state=xxxx&scope=openid+profile+email&client_secret=xxxx&grant_type=authorization_code&redirect_uri=something&code=xxxxx&client_id=xxxxx"
}
```

### **POST /oauth2/v1/access_token**

The `POST /oauth2/v1/access_token` endpoint performs the final setup and validation of OAuth version 2 accounts. Information as received from the third party upon redirection to the previously posted `callback_uri` are sent to this endpoint, with other applicable account information, for final setup. The account is then validated and, if successful, the account is returned; if there is an error, it is to be raised appropriately.

The information that is sent to endpoint includes:
* `fields.callback_uri` - callback uri that is used for user redirection
* `code` - the authorization code received from the authorization server during redirect on `callback_uri`

Request body sample:
```
{
  "fields": {
    "callback_uri": "https://oauth-svc.fibery.io"
  },
  "code": "xxxxx"
}
```

Response can include any data that will be used to authenticate account and fetch information.

> Tip: You can include parameters with `refresh_token` and `expires_on` and then on /validate step proceed with access token refresh if it is expired or about to expire.

Response body sample:
```
{
  "access_token": "xxxxxx",
  "refresh_token": "xxxxxx",
  "expires_on": "2020-01-01T09:53:41.000Z"
}
```

# Fibery Field Types

In terms of integration, a Fibery Field type is represented by the combination of `type` and `subType` parameters in the schema field configuration.

## Number Fields

### Decimal (Money Format)
```typescript
{
  id: "amount",
  name: "Amount",
  type: "number",
  format: {
    format: "Money",
    currencyCode: "EUR",
    hasThousandSeparator: true,
    precision: 2
  }
}
```

### Decimal (Percent Format)
```typescript
{
  id: "percent",
  name: "Percent",
  type: "number",
  format: {
    format: "Percent",
    precision: 2
  }
}
```

### Decimal (Number Format with Unit)
```typescript
{
  id: "value",
  name: "Value",
  type: "number",
  format: {
    format: "Number",
    unit: "ea",
    hasThousandSeparator: true,
    precision: 2
  }
}
```

### Integer
```typescript
{
  id: "count",
  name: "Count",
  type: "number",
  subType: "integer"
}
```

## Text Fields

### Plain Text
```typescript
{
  id: "description",
  name: "Description",
  type: "text"
}
```

### Text with Phone Format
```typescript
{
  id: "phone",
  name: "Phone",
  type: "text",
  format: {
    format: "phone"
  }
}
```

### URL
```typescript
{
  id: "website",
  name: "Website",
  type: "text",
  subType: "url"
}
```

### Email
```typescript
{
  id: "email",
  name: "Email",
  type: "text",
  subType: "email"
}
```

### Boolean
Stored as text. Accepts: "true", "yes", "on", "1", "checked" → `true`; "false", "no", "off", "0", "" → `false`

```typescript
{
  id: "isActive",
  name: "Is Active",
  type: "text",
  subType: "boolean"
}
```

### Rich Text (HTML)
```typescript
{
  id: "content",
  name: "Content",
  type: "text",
  subType: "html"
}
```

### Rich Text (Markdown)
```typescript
{
  id: "notes",
  name: "Notes",
  type: "text",
  subType: "md"
}
```

### Icon (Emoji)
Value should be a native emoji (👋🏻) or alias (`:wave::skin-tone-2:`)

```typescript
{
  id: "icon",
  name: "Icon",
  type: "text",
  subType: "icon"
}
```

### Location
Supports various coordinate formats or stringified JSON with `longitude`, `latitude`, `fullAddress`

```typescript
{
  id: "location",
  name: "Location",
  type: "text",
  subType: "location"
}
// Supported values:
// - Coordinates: "40.123, -74.123"
// - DMS: "40° 7' 22.8\" N 74° 7' 22.8\" W"
// - JSON: "{\"longitude\": \"52.2297\", \"latitude\": \"21.0122\", \"fullAddress\": \"Warsaw, Poland\"}"
```

## Date Fields

### Date-Time
Value format: `2020-01-22T01:02:23.977Z`

```typescript
{
  id: "createdAt",
  name: "Created At",
  type: "date"
}
```

### Date (Day only)
Value format: `2020-08-22`

```typescript
{
  id: "dueDate",
  name: "Due Date",
  type: "date",
  subType: "day"
}
```

### Date Range
Value is a stringified JSON object with `start` and `end` fields

```typescript
{
  id: "period",
  name: "Period",
  type: "text",
  subType: "date-range"
}
// Value: "{\"start\": \"2020-01-22\", \"end\": \"2020-08-19\"}"
```

### Date-Time Range
Value is a stringified JSON object with `start` and `end` fields

```typescript
{
  id: "timeRange",
  name: "Time Range",
  type: "text",
  subType: "date-time-range"
}
// Value: "{\"start\": \"2020-01-22T01:02:23.977Z\", \"end\": \"2020-08-18T06:02:23.977Z\"}"
```

## Select Fields

### Single Select
If `options` are not provided, Fibery will infer them from data

```typescript
{
  id: "status",
  name: "Status",
  type: "text",
  subType: "single-select",
  options: [
    {
      name: "Open",
      icon: "laughing",
      color: "#f2e2f4"
    },
    {
      name: "In Progress"
    },
    {
      name: "Closed"
    }
  ]
}
```

### Multi Select
Type can be `"text"` or `"array[text]"`. Values can be JSON array `["JS", "Java"]` or comma-separated string `"JS,Java"`

```typescript
{
  id: "tags",
  name: "Tags",
  type: "array[text]",
  subType: "multi-select",
  options: [
    {
      name: "JS",
      icon: "laughing",
      color: "#f2e2f4"
    },
    {
      name: "Java"
    },
    {
      name: "Closure"
    }
  ]
}
```

### Workflow
Must include options with `default: true` and `final: true`. Can optionally include `type: "Not started" | "Started" | "Finished"`

```typescript
{
  id: "workflow",
  name: "Workflow",
  type: "text",
  subType: "workflow",
  options: [
    {
      name: "Open",
      icon: "laughing",
      color: "#f2e2f4",
      default: true
    },
    {
      name: "In Progress",
      type: "Started"
    },
    {
      name: "Closed",
      final: true
    }
  ]
}
```

## File Fields

### Single File
```typescript
{
  id: "attachment",
  name: "Attachment",
  type: "text",
  subType: "file"
}
// Value: "https://example.com/file.pdf"
```

### Multiple Files
```typescript
{
  id: "attachments",
  name: "Attachments",
  type: "array[text]",
  subType: "file"
}
// Value: ["https://example.com/file1.pdf", "https://example.com/file2.pdf"]
```

**File Authentication:** For files behind authentication, use `app://resource` format and implement `POST /api/v1/synchronizer/resource` endpoint.

**File Uniqueness:** Files are unique by URL. To prevent re-uploading files with temporary URLs, add `__file-key` parameter:
- `https://myapp/files/temp-token-1?__file-key=file-id`
- `https://myapp/files/temp-token-2?__file-key=file-id` (same file, different token)

### Avatar
Link to an image file

```typescript
{
  id: "avatar",
  name: "Avatar",
  type: "text",
  subType: "avatar"
}
// Value: "https://example.com/avatar.jpg"
```

## Special Field Types

### Title Field Override
By default, the integration uses the field with id `name` as the title field. You can override this with `subType: "title"`

```typescript
{
  commitName: {
    type: "text",
    name: "Commit Name",
    subType: "title"
  }
}
```

## Relations

### People Relations (Native Relations to Fibery Users)
Use `kind: "native"` and `targetType: "fibery/user"` for relations to Fibery users

```typescript
{
  project: {
    id: {
      name: "Id",
      type: "id"
    },
    // Single user relation
    owner: {
      name: "Owner",
      type: "text",
      relation: {
        kind: "native",
        targetType: "fibery/user",
        cardinality: "many-to-one",
        targetName: "My Projects",
        targetFieldId: "user/email"
      }
    },
    // Multiple users relation
    assignees: {
      name: "Assignees",
      type: "array[text]",
      relation: {
        kind: "native",
        targetType: "fibery/user",
        cardinality: "many-to-many",
        targetName: "Assigned To",
        targetFieldId: "user/email"
      }
    }
  }
}
```

**targetFieldId for user relations:**
- `"user/email"` - Finds users by email address (case sensitive)
- Other values - Uses the `Name` field to find a user

### Integration Relations (Between Synced Types)
Example: `Project` has many `Branches`

```typescript
{
  project: {
    id: {
      name: "Id",
      type: "id"
    }
    // other fields
  },
  branch: {
    id: {
      name: "Id",
      type: "id"
    },
    projectId: {
      name: "Project Id",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Project",
        targetType: "project",
        targetFieldId: "id",
        targetName: "Branches"
      }
    }
    // other fields
  }
}
```

**Created fields:**
- `Project Id` (text) - Hidden field in `Branch` type for auto-linking
- `Project` (relation) - Relation field in `Branch` type
- `Branches` (collection) - Reverse relation field in `Project` type

**Supported cardinalities:**
- `"many-to-one"` - Multiple entities can reference one entity
- `"many-to-many"` - Multiple entities can reference multiple entities
- `"one-to-one"` - One entity references one entity

# Your Task

After knowing what Fibery integration development roughly look like, you now must:

1. **Analyze the API documentation thoroughly**
2. **Document key endpoints and data models**
3. **Provide this information for the integration developer**

# Research Process

### 1. Initial API Analysis

**Fetch and analyze the API documentation:**
- Read the main API documentation page and the pages it links to if needed
- Identify the API version and protocol (REST, GraphQL, gRPC, etc.). Fibery integrations do not support webhooks, so don't include them in the report.
- Determine authentication methods (OAuth2, API Key, JWT, etc.) and what needs to be done to get integration working with each
- Check for rate limits and pagination strategies
- Look for official SDKs and libraries

### 2. SDK Recommendation

**Determine the best integration approach:**

**Option A: Official SDK**
- Check if there's an official Node.js/TypeScript SDK
- Verify the SDK is actively maintained (recent commits, npm downloads)
- Ensure SDK supports the features needed for integration

**Option B: Direct HTTP calls with `got`**
- Recommend if no good SDK exists or API is very simple

### 3. Data Model

**Document the core data model**
- List the main objects e.g., Issues, Projects, Users, Comments)
- Identify relationships between entities
- Figure out minimal USEFUL set of fields and objects to start with

### 4. Authentication

**Determine which authentication methods are possible**
- List authentication methods available with a quick analysis of each
- Recommend OAuth method if present. It may require additional setup from developer, but it is much easier for the end user to use

### 5. Key Endpoints

**Document essential API endpoints:**
- Authentication endpoints/methods
- CRUD operations for main objects/fields
- List/search endpoints with pagination

### 6. Other Information

- What rate limits do they have?
- Any API quirks or gotchas to be aware of

## Important Guidelines

1. **Be thorough** - Provide enough detail to be useful, don't overwhelm with unnecessary information, but include enough so a dev can develop a POC based off that
2. **Focus on integration needs** - Prioritize information that's relevant for building a Fibery integration
3. **Verify information** - Double-check SDK recommendations, endpoint URLs, and technical details
4. **Highlight gotchas** - If you find any API quirks, limitations, or common issues, call them out clearly
5. **Provide examples** - Include code snippets for common operations when possible. However, provide examples of target platform's API usage. Do not provide examples of how to handle it in Fibery integration
6. **Stay current** - Check for the latest API version and most recent documentation
7. **Think like a developer** - What would YOU want to know if you were building this integration?

## When You Don't Find Information

If certain information is not available in the documentation:
- Clearly state what's missing
- Suggest where to look for it (GitHub issues, community forums, etc.)
