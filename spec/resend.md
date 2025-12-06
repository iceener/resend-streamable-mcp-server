# Introduction

> Understand general concepts, response codes, and authentication strategies.

## Base URL

The Resend API is built on **REST** principles. We enforce **HTTPS** in every request to improve data security, integrity, and privacy. The API does not support **HTTP**.

All requests contain the following base URL:

```
https://api.resend.com
```

## Authentication

To authenticate you need to add an *Authorization* header with the contents of the header being `Bearer re_xxxxxxxxx` where `re_xxxxxxxxx` is your [API Key](https://resend.com/api-keys).

```
Authorization: Bearer re_xxxxxxxxx
```

## Response codes

Resend uses standard HTTP codes to indicate the success or failure of your requests.

In general, `2xx` HTTP codes correspond to success, `4xx` codes are for user-related failures, and `5xx` codes are for infrastructure issues.

| Status | Description                             |
| ------ | --------------------------------------- |
| `200`  | Successful request.                     |
| `400`  | Check that the parameters were correct. |
| `401`  | The API key used was missing.           |
| `403`  | The API key used was invalid.           |
| `404`  | The resource was not found.             |
| `429`  | The rate limit was exceeded.            |
| `5xx`  | Indicates an error with Resend servers. |

<Info>
  Check [Error Codes](/api-reference/errors) for a comprehensive breakdown of
  all possible API errors.
</Info>

## Rate limit

The default maximum rate limit is **2 requests per second**. This number can be increased for trusted senders by request. After that, you'll hit the rate limit and receive a `429` response error code.

Learn more about our [rate limits](/api-reference/rate-limit).

## FAQ

<AccordionGroup>
  <Accordion title="How does pagination work with the API?">
    Some endpoints support cursor-based pagination to help you browse through
    large datasets efficiently. Check our [pagination
    guide](/api-reference/pagination) for detailed information on how to use
    pagination parameters.
  </Accordion>

  <Accordion title="How do you handle API versioning?">
    Currently, there's no versioning system in place. We plan to add versioning
    via calendar-based headers in the future.
  </Accordion>
</AccordionGroup>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Pagination

> Learn how pagination works in the Resend API.

## Overview

Several Resend API endpoints support **cursor-based pagination** to help you efficiently browse through large datasets. You can safely navigate lists with guaranteed stability, even if new objects are created or deleted while you're still requesting pages.

Paginated endpoints responses include:

* `object`: always set to `list`.
* `has_more`: indicates whether there are more elements available.
* `data`: the list of returned items.

You can navigate through the results using the following parameters:

* `limit`: the number of items to return per page.
* `after`: the cursor to use to get the next page of results.
* `before`: the cursor to use to get the previous page of results.

Use the `id` of objects as the cursor for pagination. The cursor itself is *excluded* from the results. For an example, see [pagination strategies below](#strategies).

## Currently-supported endpoints

Existing list endpoints can optionally return paginated results:

* [List Domains](/api-reference/domains/list-domains)
* [List API Keys](/api-reference/api-keys/list-api-keys)
* [List Broadcasts](/api-reference/broadcasts/list-broadcasts)
* [List Segments](/api-reference/segments/list-segments)
* [List Contacts](/api-reference/contacts/list-contacts)
* [List Receiving Emails](/api-reference/emails/list-received-emails)
* [List Receiving Email Attachments](/api-reference/emails/list-received-email-attachments)

<Info>
  Note that for these endpoints, the `limit` parameter is optional. If you do
  not provide a `limit`, all items will be returned in a single response.
</Info>

Newer list endpoints always return paginated results:

* [List Emails](/api-reference/emails/list-emails)
* [List Templates](/api-reference/templates/list-templates)
* [List Topics](/api-reference/topics/list-topics)

## Parameters

All paginated endpoints support the following query parameters:

<ParamField query="limit" type="number">
  The number of items to return per page. Default is `20`, maximum is `100`, and
  minimum is `1`.
</ParamField>

<ParamField query="after" type="string">
  The cursor after which to start retrieving items. To get the next page, use
  the ID of the last item from the current page. This will return the page that
  **starts after** the object with this ID (excluding the passed ID itself).
</ParamField>

<ParamField query="before" type="string">
  The cursor before which to start retrieving items. To get the previous page,
  use the ID of the first item from the current page. This will return the page
  that **ends before** the object with this ID (excluding the passed ID itself).
</ParamField>

<Warning>
  You can only use either `after` or `before`, not both simultaneously.
</Warning>

## Response Format

Paginated endpoints return responses in the following format:

```json Response Format theme={null}
{
  "object": "list",
  "has_more": true,
  "data": [
    /* Array of resources */
  ]
}
```

<ResponseField name="object" type="string">
  Always set to `list` for paginated responses.
</ResponseField>

<ResponseField name="has_more" type="boolean">
  Indicates whether there are more items available beyond the current page.
</ResponseField>

<ResponseField name="data" type="array">
  An array containing the actual resources for the current page.
</ResponseField>

## Strategies

### Forward Pagination

To paginate forward through results (newer to older items), use the `after` parameter with the ID of the **last item** from the current page:

<CodeGroup>
  ```ts Node.js theme={null}
  const resend = new Resend('re_xxxxxxxxx');

  // First page
  const { data: firstPage } = await resend.contacts.list({ limit: 50 });

  // Second page (if has_more is true)
  if (firstPage.has_more) {
    const lastId = firstPage.data[firstPage.data.length - 1].id;
    const { data: secondPage } = await resend.contacts.list({
      limit: 50,
      after: lastId,
    });
  }
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  // First page
  $firstPage = $resend->contacts->list(['limit' => 50]);

  // Second page (if has_more is true)
  if ($firstPage['has_more']) {
      $lastId = end($firstPage['data'])['id'];
      $secondPage = $resend->contacts->list([
          'limit' => 50,
          'after' => $lastId
      ]);
  }
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  # First page
  first_page = resend.Contacts.list(limit=50)

  # Second page (if has_more is true)
  if first_page['has_more']:
      last_id = first_page['data'][-1]['id']
      second_page = resend.Contacts.list(limit=50, after=last_id)
  ```

  ```ruby Ruby theme={null}
  Resend.api_key = "re_xxxxxxxxx"

  # First page
  first_page = Resend::Contacts.list(limit: 50)

  # Second page (if has_more is true)
  if first_page['has_more']
    last_id = first_page['data'].last['id']
    second_page = Resend::Contacts.list(limit: 50, after: last_id)
  end
  ```

  ```go Go theme={null}
  import "github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  // First page
  firstPage, err := client.Contacts.List(&resend.ListContactsRequest{
      Limit: 50,
  })

  // Second page (if has_more is true)
  if firstPage.HasMore {
      lastId := firstPage.Data[len(firstPage.Data)-1].ID
      secondPage, err := client.Contacts.List(&resend.ListContactsRequest{
          Limit: 50,
          After: lastId,
      })
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result, types::ListContactOptions};

  #[tokio::main]
  async fn main() -> Result<()> {
      let resend = Resend::new("re_xxxxxxxxx");

      // First page
      let list_opts = ListContactOptions::default().with_limit(50);
      let first_page = resend.emails.list(list_opts).await?;

      // Second page (if has_more is true)
      if first_page.has_more {
          let last_id = &first_page.data.last().unwrap().id;
          let list_opts = ListContactOptions::default()
              .with_limit(10)
              .list_after(last_id);
          let second_page = resend.contacts.list(list_opts).await?;
      }

      Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          // First page
          ListEmailsResponse firstPage = resend.emails().list(10);

          // Second page (if has_more is true)
          if (firstPage.getHasMore()) {
              String lastId = firstPage.getData().get(firstPage.getData().size() - 1).getId();
              ListContactsResponse secondPage = resend.contacts().list(50, lastId, null);
          }
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;
  using System.Linq;

  IResend resend = ResendClient.Create("re_xxxxxxxxx");

  // First page
  var firstPage = await resend.EmailListAsync( new PaginatedQuery() {
    Limit = 50,
  });

  // Second page (if has_more is true)
  if (firstPage.Content.HasMore)
  {
      var lastId = firstPage.Content.Data.Last().Id;
      var secondPage = await resend.EmailListAsync( new PaginatedQuery() {
        Limit = 50,
        After = lastId.ToString(),
      });
  }
  ```

  ```bash cURL theme={null}
  # First page
  curl -X GET 'https://api.resend.com/contacts?limit=50' \
       -H 'Authorization: Bearer re_xxxxxxxxx'

  # Second page
  curl -X GET 'https://api.resend.com/contacts?limit=50&after=LAST_ID_FROM_PREVIOUS_PAGE' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</CodeGroup>

### Backward Pagination

To paginate backward through results (older to newer items), use the `before` parameter with the ID of the **first item** from the current page (or the most recent ID you have in your system):

<CodeGroup>
  ```ts Node.js theme={null}
  const resend = new Resend('re_xxxxxxxxx');

  // Start from a specific point and go backward
  const page = await resend.contacts.list({
    limit: 50,
    before: 'some-contact-id',
  });

  if (page.data.has_more) {
    const firstId = page.data.data[0].id;
    const previousPage = await resend.contacts.list({
      limit: 50,
      before: firstId,
    });
  }
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  // Start from a specific point and go backward
  $page = $resend->contacts->list([
      'limit' => 50,
      'before' => 'some-contact-id'
  ]);

  if ($page['has_more']) {
      $firstId = $page['data'][0]['id'];
      $previousPage = $resend->contacts->list([
          'limit' => 50,
          'before' => $firstId
      ]);
  }
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  # Start from a specific point and go backward
  page = resend.Contacts.list(limit=50, before="some-contact-id")

  if page["has_more"]:
      first_id = page["data"][0]["id"]
      previous_page = resend.Contacts.list(limit=50, before=first_id)
  ```

  ```ruby Ruby theme={null}
  Resend.api_key = "re_xxxxxxxxx"

  # Start from a specific point and go backward
  page = Resend::Contacts.list(limit: 50, before: 'some-contact-id')

  if page['has_more']
    first_id = page['data'].first['id']
    previous_page = Resend::Contacts.list(limit: 50, before: first_id)
  end
  ```

  ```go Go theme={null}
  import "github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  // Start from a specific point and go backward
  page, err := client.Contacts.List(&resend.ListContactsRequest{
      Limit:  resend.Int(50),
      Before: resend.String("some-contact-id"),
  })

  if page.HasMore {
      firstId := page.Data[0].ID
      previousPage, err := client.Contacts.List(&resend.ListContactsRequest{
          Limit:  resend.Int(50),
          Before: resend.String(firstId),
      })
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result, types::ListContactOptions};

  #[tokio::main]
  async fn main() -> Result<()> {
      let resend = Resend::new("re_xxxxxxxxx");

      // Start from a specific point and go backward
      let list_opts = ListContactOptions::default()
          .with_limit(50)
          .list_before("some-email-id");
      let page = resend.contacts.list(list_opts).await?;

      if page.has_more {
          let first_id = &page.data.first().unwrap().id;
          let list_opts = ListContactOptions::default()
              .with_limit(10)
              .list_before(first_id);
          let previous_page = resend.contacts.list(list_opts).await?;
      }

      Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          // Start from a specific point and go backward
          ListContactsResponse page = resend.contacts().list(50, null, "some-contact-id");

          if (page.getHasMore()) {
              String firstId = page.getData().get(0).getId();
              ListContactsResponse previousPage = resend.contacts().list(50, null, firstId);
          }
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;
  using System.Linq;

  IResend resend = ResendClient.Create("re_xxxxxxxxx");

  // Start from a specific point and go backward
  var page = await resend.EmailListAsync( new PaginatedQuery() {
    Limit = 50,
    Before = "some-email-id",
  });

  if (page.Content.HasMore)
  {
      var firstId = page.Content.Data.First().Id;
      var prevPage = await resend.EmailListAsync( new PaginatedQuery() {
        Limit = 50,
        Before = firstId.ToString(),
      });
  }
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/contacts?limit=50&before=some-contact-id' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</CodeGroup>

## Best Practices

<AccordionGroup>
  <Accordion title="Use appropriate page sizes">
    Choose a `limit` that balances performance and usability. Smaller pages are good for real-time applications, while larger pages
    (hundreds of items) work better for bulk processing.
  </Accordion>

  <Accordion title="Handle pagination gracefully">
    Always check the `has_more` field before attempting to fetch additional pages.
    This prevents unnecessary API calls when you've reached the end of the
    dataset.
  </Accordion>

  <Accordion title="Consider rate limits">
    Be mindful of API rate limits when paginating through large datasets.
    Implement appropriate delays or batching strategies if processing many
    pages.
  </Accordion>
</AccordionGroup>

## Error Handling

Pagination requests may return the following validation errors:

| Error              | Description                                         |
| ------------------ | --------------------------------------------------- |
| `validation_error` | Invalid cursor format or limit out of range (1-100) |
| `validation_error` | Both `before` and `after` parameters provided       |

Example error response:

```json Error Response theme={null}
{
  "name": "validation_error",
  "statusCode": 422,
  "message": "The pagination limit must be a number between 1 and 100. See https://resend.com/docs/pagination for more information."
}
```


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Rate Limit

> Understand rate limits and how to increase them.

The response headers describe your current rate limit following every request in conformance with the [sixth IETF standard draft](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers-06):

| Header name           | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `ratelimit-limit`     | Maximum number of requests allowed within a window.                 |
| `ratelimit-remaining` | How many requests you have left within the current window.          |
| `ratelimit-reset`     | How many seconds until the limits are reset.                        |
| `retry-after`         | How many seconds you should wait before making a follow-up request. |

The default maximum rate limit is **2 requests per second**. This number can be increased for trusted senders upon request.

After that, you'll hit the rate limit and receive a `429` response error code. You can find all 429 responses by filtering for 429 at the [Resend Logs page](https://resend.com/logs?status=429).

To prevent this, we recommend reducing the rate at which you request the API. This can be done by introducing a queue mechanism or reducing the number of concurrent requests per second. If you have specific requirements, [contact support](https://resend.com/contact) to request a rate increase.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Errors

> Troubleshoot problems with this comprehensive breakdown of all error codes.

## Error schema

We use standard HTTP response codes for success and failure notifications, and our errors are further classified by type.

### `invalid_idempotency_key`

* **Status:** 400
* **Message:** The key must be between 1-256 chars.
* **Suggested action:** Retry with a valid idempotency key.

### `validation_error`

* **Status:** 400
* **Message:** We found an error with one or more fields in the request.
* **Suggested action:** The message will contain more details about what field and error were found.

### `missing_api_key`

* **Status:** 401
* **Message:** Missing API key in the authorization header.
* **Suggested action:** Include the following header in the request: `Authorization: Bearer YOUR_API_KEY`.

### `restricted_api_key`

* **Status:** 401
* **Message:** This API key is restricted to only send emails.
* **Suggested action:** Make sure the API key has `Full access` to perform actions other than sending emails.

### `invalid_api_key`

* **Status:** 403
* **Message:** API key is invalid.
* **Suggested action:** Make sure the API key is correct or generate a new [API key in the dashboard](https://resend.com/api-keys).

### `validation_error`

* **Status:** 403
* **Message:** You can only send testing emails to your own email address (`youremail@domain.com`). To send emails to other recipients, please verify a domain at resend.com/domains, and change the `from` address to an email using this domain.
* **Suggested action:** In [Resend's Domain page](https://resend.com/domains), add and verify a domain for which you have DNS access. This allows you to send emails to addresses beyond your own. [Learn more about resolving this error](/knowledge-base/403-error-resend-dev-domain).

### `validation_error`

* **Status:** 403
* **Message:** The `domain.com` domain is not verified. Please, add and verify your domain.
* **Suggested action:** Make sure the domain in your API request's `from` field matches a domain you've verified in Resend. Update your API request to use your verified domain, or add and verify the domain you're trying to use. [Learn more about resolving this error](/knowledge-base/403-error-domain-mismatch).

### `not_found`

* **Status:** 404
* **Message:** The requested endpoint does not exist.
* **Suggested action:** Change your request URL to match a valid API endpoint.

### `method_not_allowed`

* **Status:** 405
* **Message:** Method is not allowed for the requested path.
* **Suggested action:** Change your API endpoint to use a valid method.

### `invalid_idempotent_request`

* **Status:** 409
* **Message:** Same idempotency key used with a different request payload.
* **Suggested action:** Change your idempotency key or payload.

### `concurrent_idempotent_requests`

* **Status:** 409
* **Message:** Same idempotency key used while original request is still in progress.
* **Suggested action:** Try the request again later.

### `invalid_attachment`

* **Status:** 422
* **Message:** Attachment must have either a `content` or `path`.
* **Suggested action:** Attachments must either have a `content` (strings, Buffer, or Stream contents) or `path` to a remote resource (better for larger attachments).

### `invalid_from_address`

* **Status:** 422
* **Message:** Invalid `from` field.
* **Suggested action:** Make sure the `from` field is a valid. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format.

### `invalid_access`

* **Status:** 422
* **Message:** Access must be "full\_access" | "sending\_access".
* **Suggested action:** Make sure the API key has necessary permissions.

### `invalid_parameter`

* **Status:** 422
* **Message:** The `parameter` must be a valid UUID.
* **Suggested action:** Check the value and make sure it's valid.

### `invalid_region`

* **Status:** 422
* **Message:** Region must be "us-east-1" | "eu-west-1" | "sa-east-1".
* **Suggested action:** Make sure the correct region is selected.

### `missing_required_field`

* **Status:** 422
* **Message:** The request body is missing one or more required fields.
* **Suggested action:** Check the error message to see the list of missing fields.

### `monthly_quota_exceeded`

* **Status:** 429
* **Message:** You have reached your monthly email quota.
* **Suggested action:** [Upgrade your plan](https://resend.com/settings/billing) to increase the monthly email quota. Both sent and received emails count towards this quota.

### `daily_quota_exceeded`

* **Status:** 429
* **Message:** You have reached your daily email quota.
* **Suggested action:** [Upgrade your plan](https://resend.com/settings/billing) to remove the daily quota limit or wait until 24 hours have passed. Both sent and received emails count towards this quota.

### `rate_limit_exceeded`

* **Status:** 429
* **Message:** Too many requests. Please limit the number of requests per second. Or [contact support](https://resend.com/contact) to increase rate limit.
* **Suggested action:** You should read the [response headers](./introduction#rate-limit) and reduce the rate at which you request the API. This can be done by introducing a queue mechanism or reducing the number of concurrent requests per second. If you have specific requirements, [contact support](https://resend.com/contact) to request a rate increase.

### `security_error`

* **Status:** 451
* **Message:** We may have found a security issue with the request.
* **Suggested action:** The message will contain more details. [Contact support](https://resend.com/contact) for more information.

### `application_error`

* **Status:** 500
* **Message:** An unexpected error occurred.
* **Suggested action:** Try the request again later. If the error does not resolve, check our [status page](https://resend-status.com) for service updates.

### `internal_server_error`

* **Status:** 500
* **Message:** An unexpected error occurred.
* **Suggested action:** Try the request again later. If the error does not resolve, check our [status page](https://resend-status.com) for service updates.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Send Email

> Start sending emails through the Resend Email API.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Body Parameters

<ParamField body="from" type="string" required>
  Sender email address.

  To include a friendly name, use the format `"Your Name <sender@domain.com>"`.
</ParamField>

<ParamField body="to" type="string | string[]" required>
  Recipient email address. For multiple addresses, send as an array of strings.
  Max 50.
</ParamField>

<ParamField body="subject" type="string" required>
  Email subject.
</ParamField>

<ParamField body="bcc" type="string | string[]">
  Bcc recipient email address. For multiple addresses, send as an array of
  strings.
</ParamField>

<ParamField body="cc" type="string | string[]">
  Cc recipient email address. For multiple addresses, send as an array of
  strings.
</ParamField>

<ResendParamField body="scheduled_at" type="string">
  Schedule email to be sent later. The date should be in natural language (e.g.: `in 1 min`) or ISO 8601 format (e.g:
  `2024-08-05T11:52:01.858Z`).

  [See examples](/dashboard/emails/schedule-email)
</ResendParamField>

<ResendParamField body="reply_to" type="string | string[]">
  Reply-to email address. For multiple addresses, send as an array of strings.
</ResendParamField>

<ParamField body="html" type="string">
  The HTML version of the message.
</ParamField>

<ParamField body="text" type="string">
  The plain text version of the message.

  <Info>
    If not provided, the HTML will be used to generate a plain text version. You
    can opt out of this behavior by setting value to an empty string.
  </Info>
</ParamField>

<ParamField body="react" type="React.ReactNode">
  The React component used to write the message. *Only available in the Node.js
  SDK.*
</ParamField>

<ParamField body="headers" type="object">
  Custom headers to add to the email.
</ParamField>

<ResendParamField body="topic_id" type="string">
  The topic ID to receive the email.

  * If the recipient is a contact and has opted-in to the topic, the email is sent.
  * If the recipient is a contact and has opted-out of the topic, the email is not sent and an error is returned.
  * If the recipient is not a contact, the email is sent if the topic default subscription value is set to `opt-in`.

  <Note>Each email address (to, cc, bcc) is checked and handled separately.</Note>
</ResendParamField>

<ParamField body="attachments" type="array">
  Filename and content of attachments (max 40MB per email, after Base64 encoding of the attachments).

  [See examples](/dashboard/emails/attachments)

  <Expandable defaultOpen="true" title="properties">
    <ParamField body="content" type="buffer | string">
      Content of an attached file, passed as a buffer or Base64 string.
    </ParamField>

    <ParamField body="filename" type="string">
      Name of attached file.
    </ParamField>

    <ParamField body="path" type="string">
      Path where the attachment file is hosted
    </ParamField>

    <ResendParamField body="content_type" type="string">
      Content type for the attachment, if not set will be derived from the filename property
    </ResendParamField>

    <ResendParamField body="content_id" type="string">
      You can embed images using the content id parameter for the attachment. To show the image, you need to include the ID in the `src` attribute of the `img` tag (e.g., `<img src="cid:...">`) of your HTML. [Learn about inline images](/dashboard/emails/embed-inline-images).
    </ResendParamField>
  </Expandable>
</ParamField>

<ParamField body="tags" type="array">
  Custom data passed in key/value pairs.

  [See examples](/dashboard/emails/tags).

  <Expandable defaultOpen="true" title="properties">
    <ParamField body="name" type="string" required>
      The name of the email tag.

      It can only contain ASCII letters (a–z, A–Z), numbers (0–9), underscores (\_), or dashes (-).

      It can contain no more than 256 characters.
    </ParamField>

    <ParamField body="value" type="string" required>
      The value of the email tag.

      It can only contain ASCII letters (a–z, A–Z), numbers (0–9), underscores (\_), or dashes (-).

      It can contain no more than 256 characters.
    </ParamField>
  </Expandable>
</ParamField>

<ParamField body="template" type="object">
  To send using a template, provide a `template` object with:

  * `id`: the id *or* the alias of the published template
  * `variables`: an object with a key for each variable (if applicable)

  <Info>
    If a `template` is provided, you cannot send `html`, `text`, or `react` in the payload, otherwise the API will return a validation error.

    When sending a template, the payload for `from`, `subject`, and `reply_to` take precedence over the template's defaults for these fields. If the template does not provide a default value for these fields, you must provide them in the payload.
  </Info>
</ParamField>

<ParamField body="id" type="string" required>
  The id of the published email template. Required if `template` is provided. Only published templates can be used when sending emails.
</ParamField>

<ParamField body="variables" type="object">
  Template variables object with key/value pairs.

  ```ts  theme={null}
  variables: {
  	CTA: 'Sign up now',
  	CTA_LINK: 'https://example.com/signup'
  }
  ```

  When sending the template, the HTML will be parsed. If all the variables used in the template were provided, the email will be sent. If not, the call will throw a validation error.

  See the [errors reference](/api-reference/errors) for more details or [learn more about templates](/dashboard/templates/introduction).

  <Expandable defaultOpen="true" title="properties">
    <ParamField body="key" type="string" required>
      The key of the variable.

      May only contain ASCII letters (a–z, A–Z), numbers (0–9), and underscores (\_). The following variable names are reserved and cannot be used: `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `UNSUBSCRIBE_URL`.

      It can contain no more than 50 characters.
    </ParamField>

    <ParamField body="value" value="string | number" required>
      The value of the variable.

      Observe these technical limitations:

      * `string`: maximum length of 50 characters
      * `number`: not greater than 2^53 - 1
    </ParamField>
  </Expandable>
</ParamField>

## Headers

<ParamField header="Idempotency-Key" type="string">
  Add an idempotency key to prevent duplicated emails.

  * Should be **unique per API request**
  * Idempotency keys expire after **24 hours**
  * Have a maximum length of **256 characters**

  [Learn more](/dashboard/emails/idempotency-keys)
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: ['delivered@resend.dev'],
    subject: 'hello world',
    html: '<p>it works!</p>',
    replyTo: 'onboarding@resend.dev',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->emails->send([
    'from' => 'Acme <onboarding@resend.dev>',
    'to' => ['delivered@resend.dev'],
    'subject' => 'hello world',
    'html' => '<p>it works!</p>',
    'reply_to': 'onboarding@resend.dev'
  ]);
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  params: resend.Emails.SendParams = {
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "hello world",
    "html": "<p>it works!</p>",
    "reply_to": "onboarding@resend.dev"
  }

  email = resend.Emails.send(params)
  print(email)
  ```

  ```rb Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  params = {
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "hello world",
    "html": "<p>it works!</p>",
    "reply_to": "onboarding@resend.dev"
  }

  sent = Resend::Emails.send(params)
  puts sent
  ```

  ```go Go theme={null}
  import (
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
    ctx := context.TODO()
    client := resend.NewClient("re_xxxxxxxxx")

    params := &resend.SendEmailRequest{
        From:        "Acme <onboarding@resend.dev>",
        To:          []string{"delivered@resend.dev"},
        Subject:     "hello world",
        Html:        "<p>it works!</p>",
        ReplyTo:     "onboarding@resend.dev"
    }

    sent, err := client.Emails.SendWithContext(ctx, params)

    if err != nil {
      panic(err)
    }
    fmt.Println(sent.Id)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::types::{CreateEmailBaseOptions};
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let from = "Acme <onboarding@resend.dev>";
    let to = ["delivered@resend.dev"];
    let subject = "hello world";
    let html = "<p>it works!</p>";
    let reply_to = "onboarding@resend.dev";

    let email = CreateEmailBaseOptions::new(from, to, subject)
      .with_html(html);

    let _email = resend.emails.send(email).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          CreateEmailOptions params = CreateEmailOptions.builder()
                  .from("Acme <onboarding@resend.dev>")
                  .to("delivered@resend.dev")
                  .subject("hello world")
                  .html("<p>it works!</p>")
                  .replyTo("onboarding@resend.dev")
                  .build();

          CreateEmailResponse data = resend.emails().send(params);
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.EmailSendAsync( new EmailMessage()
  {
      From = "Acme <onboarding@resend.dev>",
      To = "delivered@resend.dev",
      Subject = "hello world",
      HtmlBody = "<p>it works!</p>",
      ReplyTo = "onboarding@resend.dev",
  } );
  Console.WriteLine( "Email Id={0}", resp.Content );
  ```

  ```bash cURL theme={null}
  curl -X POST 'https://api.resend.com/emails' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "hello world",
    "html": "<p>it works!</p>",
    "reply_to": "onboarding@resend.dev"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Send Batch Emails

> Trigger up to 100 batch emails at once.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

Instead of sending one email per HTTP request, we provide a batching endpoint that permits you to send up to 100 emails in a single API call.

## Body Parameters

<ParamField body="from" type="string" required>
  Sender email address.

  To include a friendly name, use the format `"Your Name <sender@domain.com>"`.
</ParamField>

<ParamField body="to" type="string | string[]" required>
  Recipient email address. For multiple addresses, send as an array of strings.
  Max 50.
</ParamField>

<ParamField body="subject" type="string" required>
  Email subject.
</ParamField>

<ParamField body="bcc" type="string | string[]">
  Bcc recipient email address. For multiple addresses, send as an array of
  strings.
</ParamField>

<ParamField body="cc" type="string | string[]">
  Cc recipient email address. For multiple addresses, send as an array of
  strings.
</ParamField>

<ResendParamField body="reply_to" type="string | string[]">
  Reply-to email address. For multiple addresses, send as an array of strings.
</ResendParamField>

<ParamField body="html" type="string">
  The HTML version of the message.
</ParamField>

<ParamField body="text" type="string">
  The plain text version of the message.

  <Info>
    If not provided, the HTML will be used to generate a plain text version. You
    can opt out of this behavior by setting value to an empty string.
  </Info>
</ParamField>

<ParamField body="react" type="React.ReactNode">
  The React component used to write the message. *Only available in the Node.js
  SDK.*
</ParamField>

<ParamField body="headers" type="object">
  Custom headers to add to the email.
</ParamField>

<ResendParamField body="topic_id" type="string">
  The topic ID to receive the email.

  * If the recipient is a contact and has opted-in to the topic, the email is sent.
  * If the recipient is a contact and has opted-out of the topic, the email is not sent and an error is returned.
  * If the recipient is not a contact, the email is sent if the topic default subscription value is set to `opt-in`.

  <Note>Each email address (to, cc, bcc) is checked and handled separately.</Note>
</ResendParamField>

<ParamField body="tags" type="array">
  Custom data passed in key/value pairs.

  [See examples](/dashboard/emails/tags).

  <Expandable defaultOpen="true" title="properties">
    <ParamField body="name" type="string" required>
      The name of the email tag.

      It can only contain ASCII letters (a–z, A–Z), numbers (0–9), underscores (\_), or dashes (-).

      It can contain no more than 256 characters.
    </ParamField>

    <ParamField body="value" type="string" required>
      The value of the email tag.

      It can only contain ASCII letters (a–z, A–Z), numbers (0–9), underscores (\_), or dashes (-).

      It can contain no more than 256 characters.
    </ParamField>
  </Expandable>
</ParamField>

<ParamField body="template" type="object">
  To send using a template, provide a `template` object with:

  * `id`: the id *or* the alias of the published template
  * `variables`: an object with a key for each variable (if applicable)

  <Info>
    If a `template` is provided, you cannot send `html`, `text`, or `react` in the payload, otherwise the API will return a validation error.

    When sending a template, the payload for `from`, `subject`, and `reply_to` take precedence over the template's defaults for these fields. If the template does not provide a default value for these fields, you must provide them in the payload.
  </Info>
</ParamField>

<ParamField body="id" type="string" required>
  The id of the published email template. Required if `template` is provided. Only published templates can be used when sending emails.
</ParamField>

<ParamField body="variables" type="object">
  Template variables object with key/value pairs.

  ```ts  theme={null}
  variables: {
  	CTA: 'Sign up now',
  	CTA_LINK: 'https://example.com/signup'
  }
  ```

  When sending the template, the HTML will be parsed. If all the variables used in the template were provided, the email will be sent. If not, the call will throw a validation error.

  See the [errors reference](/api-reference/errors) for more details or [learn more about templates](/dashboard/templates/introduction).

  <Expandable defaultOpen="true" title="properties">
    <ParamField body="key" type="string" required>
      The key of the variable.

      May only contain ASCII letters (a–z, A–Z), numbers (0–9), and underscores (\_). The following variable names are reserved and cannot be used: `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `UNSUBSCRIBE_URL`.

      It can contain no more than 50 characters.
    </ParamField>

    <ParamField body="value" value="string | number" required>
      The value of the variable.

      Observe these technical limitations:

      * `string`: maximum length of 50 characters
      * `number`: not greater than 2^53 - 1
    </ParamField>
  </Expandable>
</ParamField>

## Headers

<ParamField header="Idempotency-Key" type="string">
  Add an idempotency key to prevent duplicated emails.

  * Should be **unique per API request**
  * Idempotency keys expire after **24 hours**
  * Have a maximum length of **256 characters**

  [Learn more about idempotency keys →](/dashboard/emails/idempotency-keys)
</ParamField>

<ParamField header="x-batch-validation" type="strict | permissive" default="strict">
  Batch validation modes control how emails are validated in batch sending.

  Choose between two modes:

  * **Strict mode (default)**: sends the batch only if all emails in the request are valid.
  * **Permissive mode**: processes all emails, allowing for partial success and returning validation errors if present.

  [Learn more about batch validation →](/dashboard/emails/batch-validation-modes)
</ParamField>

## Limitations

The `attachments` and `scheduled_at` fields are not supported yet.

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.batch.send([
    {
      from: 'Acme <onboarding@resend.dev>',
      to: ['foo@gmail.com'],
      subject: 'hello world',
      html: '<h1>it works!</h1>',
    },
    {
      from: 'Acme <onboarding@resend.dev>',
      to: ['bar@outlook.com'],
      subject: 'world hello',
      html: '<p>it works!</p>',
    },
  ]);
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->batch->send([
    [
      'from' => 'Acme <onboarding@resend.dev>',
      'to' => ['foo@gmail.com'],
      'subject' => 'hello world',
      'html' => '<h1>it works!</h1>',
    ],
    [
      'from' => 'Acme <onboarding@resend.dev>',
      'to' => ['bar@outlook.com'],
      'subject' => 'world hello',
      'html' => '<p>it works!</p>',
    ]
  ]);
  ```

  ```py Python theme={null}
  import resend
  from typing import List

  resend.api_key = "re_xxxxxxxxx"

  params: List[resend.Emails.SendParams] = [
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["foo@gmail.com"],
      "subject": "hello world",
      "html": "<h1>it works!</h1>",
    },
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["bar@outlook.com"],
      "subject": "world hello",
      "html": "<p>it works!</p>",
    }
  ]

  resend.Batch.send(params)
  ```

  ```rb Ruby theme={null}
  require "resend"

  Resend.api_key = 're_xxxxxxxxx'

  params = [
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["foo@gmail.com"],
      "subject": "hello world",
      "html": "<h1>it works!</h1>",
    },
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["bar@outlook.com"],
      "subject": "world hello",
      "html": "<p>it works!</p>",
    }
  ]

  Resend::Batch.send(params)
  ```

  ```go Go theme={null}
  package examples

  import (
  	"fmt"
  	"os"

  	"github.com/resend/resend-go/v3"
  )

  func main() {

    ctx := context.TODO()

    client := resend.NewClient("re_xxxxxxxxx")

    var batchEmails = []*resend.SendEmailRequest{
      {
        From:    "Acme <onboarding@resend.dev>",
        To:      []string{"foo@gmail.com"},
        Subject: "hello world",
        Html:    "<h1>it works!</h1>",
      },
      {
        From:    "Acme <onboarding@resend.dev>",
        To:      []string{"bar@outlook.com"},
        Subject: "world hello",
        Html:    "<p>it works!</p>",
      },
    }

    sent, err := client.Batch.SendWithContext(ctx, batchEmails)

    if err != nil {
      panic(err)
    }
    fmt.Println(sent.Data)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::types::CreateEmailBaseOptions;
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let emails = vec![
      CreateEmailBaseOptions::new(
        "Acme <onboarding@resend.dev>",
        vec!["foo@gmail.com"],
        "hello world",
      )
      .with_html("<h1>it works!</h1>"),
      CreateEmailBaseOptions::new(
        "Acme <onboarding@resend.dev>",
        vec!["bar@outlook.com"],
        "world hello",
      )
      .with_html("<p>it works!</p>"),
    ];

    let _emails = resend.batch.send(emails).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          CreateEmailOptions firstEmail = CreateEmailOptions.builder()
              .from("Acme <onboarding@resend.dev>")
              .to("foo@gmail.com")
              .subject("hello world")
              .html("<h1>it works!</h1>")
              .build();

          CreateEmailOptions secondEmail = CreateEmailOptions.builder()
              .from("Acme <onboarding@resend.dev>")
              .to("bar@outlook.com")
              .subject("world hello")
              .html("<p>it works!</p>")
              .build();

          CreateBatchEmailsResponse data = resend.batch().send(
              Arrays.asList(firstEmail, secondEmail)
          );
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var mail1 = new EmailMessage()
  {
      From = "Acme <onboarding@resend.dev>",
      To = "foo@gmail.com",
      Subject = "hello world",
      HtmlBody = "<p>it works!</p>",
  };

  var mail2 = new EmailMessage()
  {
      From = "Acme <onboarding@resend.dev>",
      To = "bar@outlook.com",
      Subject = "hello world",
      HtmlBody = "<p>it works!</p>",
  };

  var resp = await resend.EmailBatchAsync( [ mail1, mail2 ] );
  Console.WriteLine( "Nr Emails={0}", resp.Content.Count );
  ```

  ```bash cURL theme={null}
  curl -X POST 'https://api.resend.com/emails/batch' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'[
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["foo@gmail.com"],
      "subject": "hello world",
      "html": "<h1>it works!</h1>"
    },
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["bar@outlook.com"],
      "subject": "world hello",
      "html": "<p>it works!</p>"
    }
  ]'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "data": [
      {
        "id": "ae2014de-c168-4c61-8267-70d2662a1ce1"
      },
      {
        "id": "faccb7a5-8a28-4e9a-ac64-8da1cc3bc1cb"
      }
    ],
    // the `errors` array is only present in permissive batch validation mode
    "errors": [
      {
        "index": 2, // 0-indexed (first item is index 0)
        "message": "The `to` field is missing."
      }
    ]
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Retrieve Email

> Retrieve a single email.

## Path Parameters

<ParamField path="id" type="string" required>
  The Email ID.
</ParamField>

<Info>
  See all available `last_event` types in [the Email Events
  overview](/dashboard/emails/introduction#understand-email-events).
</Info>

<RequestExample>
  ```js Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.emails.get(
    '37e4414c-5e25-4dbc-a071-43552a4bd53b',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->emails->get('37e4414c-5e25-4dbc-a071-43552a4bd53b');
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"
  resend.Emails.get(email_id="4ef9a417-02e9-4d39-ad75-9611e0fcc33c")
  ```

  ```ruby Ruby theme={null}
  Resend.api_key = "re_xxxxxxxxx"
  email = Resend::Emails.get("4ef9a417-02e9-4d39-ad75-9611e0fcc33c")
  puts email
  ```

  ```go Go theme={null}
  import "github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  email, err := client.Emails.Get("4ef9a417-02e9-4d39-ad75-9611e0fcc33c")
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _email = resend
      .emails
      .get("4ef9a417-02e9-4d39-ad75-9611e0fcc33c")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          Email email = resend.emails().get("4ef9a417-02e9-4d39-ad75-9611e0fcc33c");
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.EmailRetrieveAsync( new Guid( "4ef9a417-02e9-4d39-ad75-9611e0fcc33c" ) );
  Console.WriteLine( "Subject={0}", resp.Content.Subject );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/emails/4ef9a417-02e9-4d39-ad75-9611e0fcc33c' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "email",
    "id": "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
    "to": ["delivered@resend.dev"],
    "from": "Acme <onboarding@resend.dev>",
    "created_at": "2023-04-03T22:13:42.674981+00:00",
    "subject": "Hello World",
    "html": "Congrats on sending your <strong>first email</strong>!",
    "text": null,
    "bcc": [],
    "cc": [],
    "reply_to": [],
    "last_event": "delivered",
    "scheduled_at": null
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# List Sent Emails

> Retrieve a list of emails sent by your team.

export const QueryParams = ({type, isRequired}) => {
  return <>
      <h2>Query Parameters</h2>

      {isRequired ? <ParamField query="limit" type="number">
          Number of {type} to retrieve.
          <ul>
            <li>
              Default value: <code>20</code>
            </li>
            <li>
              Maximum value: <code>100</code>
            </li>
            <li>
              Minimum value: <code>1</code>
            </li>
          </ul>
        </ParamField> : <>
          <p>
            Note that the <code>limit</code> parameter is <em>optional</em>. If
            you do not provide a <code>limit</code>, all {type} will be returned
            in a single response.
          </p>
          <ParamField query="limit" type="number">
            Number of {type} to retrieve.
            <ul>
              <li>
                Maximum value: <code>100</code>
              </li>
              <li>
                Minimum value: <code>1</code>
              </li>
            </ul>
          </ParamField>
        </>}

      <ParamField query="after" type="string">
        The ID <em>after</em> which we'll retrieve more {type} (for pagination).
        This ID will <em>not</em> be included in the returned list. Cannot be
        used with the
        <code>before</code> parameter.
      </ParamField>
      <ParamField query="before" type="string">
        The ID <em>before</em> which we'll retrieve more {type} (for
        pagination). This ID will <em>not</em> be included in the returned list.
        Cannot be used with the <code>after</code> parameter.
      </ParamField>
      <Info>
        You can only use either <code>after</code> or <code>before</code>{' '}
        parameter, not both. See our{' '}
        <a href="/api-reference/pagination">pagination guide</a> for more
        information.
      </Info>
    </>;
};

You can list all emails sent by your team. The list returns references to individual emails. If needed, you can use the `id` of an email to retrieve the email HTML to plain text using the [Retrieve Email](/api-reference/emails/retrieve-email) endpoint or the [Retrieve Attachments](/api-reference/emails/list-email-attachments) endpoint to get an email's attachments.

<Info>
  This endpoint only returns emails sent by your team. If you need to list
  emails received by your domain, use the [List Received
  Emails](/api-reference/emails/list-received-emails) endpoint.
</Info>

<QueryParams type="emails" isRequired={true} />

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.emails.list();
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->emails->list();
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"
  resend.Emails.list()
  ```

  ```ruby Ruby theme={null}
  Resend.api_key = "re_xxxxxxxxx"
  emails = Resend::Emails.list
  puts emails
  ```

  ```go Go theme={null}
  import (
    "context"
    "fmt"

    "github.com/resend/resend-go/v3"
  )

  ctx := context.TODO()
  client := resend.NewClient("re_xxxxxxxxx")

  paginatedResp, err := client.Emails.ListWithOptions(ctx, nil)
  if err != nil {
    panic(err)
  }

  fmt.Printf("Found %d emails\n", len(paginatedResp.Data))

  if paginatedResp.HasMore {
    opts := &resend.ListOptions{
      After: &paginatedResp.Data[len(paginatedResp.Data)-1].ID,
    }
    paginatedResp, err = client.Emails.ListWithOptions(ctx, opts)

    if err != nil {
      panic(err)
    }

    fmt.Printf("Found %d more emails in next page\n", len(paginatedResp.Data))
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{list_opts::ListOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _emails = resend.emails.list(ListOptions::default()).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          ListEmailsResponseSuccess emails = resend.emails().list();
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.EmailListAsync();
  Console.WriteLine( "Count={0}", resp.Content.Data.Count );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/emails' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "list",
    "has_more": false,
    "data": [
      {
        "id": "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
        "to": ["delivered@resend.dev"],
        "from": "Acme <onboarding@resend.dev>",
        "created_at": "2023-04-03T22:13:42.674981+00:00",
        "subject": "Hello World",
        "bcc": null,
        "cc": null,
        "reply_to": null,
        "last_event": "delivered",
        "scheduled_at": null
      },
      {
        "id": "3a9f8c2b-1e5d-4f8a-9c7b-2d6e5f8a9c7b",
        "to": ["user@example.com"],
        "from": "Acme <onboarding@resend.dev>",
        "created_at": "2023-04-03T21:45:12.345678+00:00",
        "subject": "Welcome to Acme",
        "bcc": null,
        "cc": null,
        "reply_to": null,
        "last_event": "opened",
        "scheduled_at": null
      }
    ]
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Update Email

> Update a scheduled email.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

<ParamField path="id" type="string" required>
  The Email ID.
</ParamField>

## Body Parameters

<ResendParamField body="scheduled_at" type="string">
  Schedule email to be sent later. The date should be in ISO 8601 format (e.g:
  2024-08-05T11:52:01.858Z).
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const oneMinuteFromNow = new Date(Date.now() + 1000 * 60).toISOString();

  const { data, error } = await resend.emails.update({
    id: '49a3999c-0ce1-4ea6-ab68-afcd6dc2e794',
    scheduledAt: oneMinuteFromNow,
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $oneMinuteFromNow = (new DateTime())->modify('+1 minute')->format(DateTime::ISO8601);

  $resend->emails->update('49a3999c-0ce1-4ea6-ab68-afcd6dc2e794', [
    'scheduled_at' => $oneMinuteFromNow
  ]);
  ```

  ```python Python theme={null}
  import resend
  from datetime import datetime, timedelta

  resend.api_key = "re_xxxxxxxxx"

  one_minute_from_now = (datetime.now() + timedelta(minutes=1)).isoformat()

  update_params: resend.Emails.UpdateParams = {
    "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
    "scheduled_at": one_minute_from_now
  }

  resend.Emails.update(params=update_params)
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  one_minute_from_now = (Time.now + 1 * 60).strftime("%Y-%m-%dT%H:%M:%S.%L%z")

  update_params = {
    "email_id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
    "scheduled_at": one_minute_from_now
  }

  Resend::Emails.update(update_params)
  ```

  ```go Go theme={null}
  import "github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  oneMinuteFromNow := time.Now().Add(time.Minute * time.Duration(1))
  oneMinuteFromNowISO := oneMinuteFromNow.Format("2006-01-02T15:04:05-0700")

  updateParams := &resend.UpdateEmailRequest{
    Id:          "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
    ScheduledAt: oneMinuteFromNowISO
  }

  updatedEmail, err := client.Emails.Update(updateParams)

  if err != nil {
    panic(err)
  }
  fmt.Printf("%v\n", updatedEmail)
  ```

  ```rust Rust theme={null}
  use chrono::{Local, TimeDelta};
  use resend_rs::types::UpdateEmailOptions;
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let one_minute_from_now = Local::now()
      .checked_add_signed(TimeDelta::minutes(1))
      .unwrap()
      .to_rfc3339();

    let update = UpdateEmailOptions::new()
      .with_scheduled_at(&one_minute_from_now);

    let _email = resend
      .emails
      .update("49a3999c-0ce1-4ea6-ab68-afcd6dc2e794", update)
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          String oneMinuteFromNow = Instant
            .now()
            .plus(1, ChronoUnit.MINUTES)
            .toString();

          UpdateEmailOptions updateParams = UpdateEmailOptions.builder()
                  .scheduledAt(oneMinuteFromNow)
                  .build();

          UpdateEmailResponse data = resend.emails().update("49a3999c-0ce1-4ea6-ab68-afcd6dc2e794", updateParams);
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  await resend.EmailRescheduleAsync(
      new Guid( "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794" ),
      DateTime.UtcNow.AddMinutes( 1 ) );
  ```

  ```bash cURL theme={null}
  curl -X PATCH 'https://api.resend.com/emails/49a3999c-0ce1-4ea6-ab68-afcd6dc2e794' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "scheduled_at": "2024-08-05T11:52:01.858Z"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "email",
    "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Cancel Email

> Cancel a scheduled email.

## Path Parameters

<ParamField path="id" type="string" required>
  The Email ID.
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.emails.cancel(
    '49a3999c-0ce1-4ea6-ab68-afcd6dc2e794',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->emails->cancel('49a3999c-0ce1-4ea6-ab68-afcd6dc2e794');
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"
  resend.Emails.cancel(email_id="49a3999c-0ce1-4ea6-ab68-afcd6dc2e794")
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Emails.cancel("49a3999c-0ce1-4ea6-ab68-afcd6dc2e794")
  ```

  ```go Go theme={null}
  import "github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  canceled, err := client.Emails.Cancel("49a3999c-0ce1-4ea6-ab68-afcd6dc2e794")
  if err != nil {
    panic(err)
  }
  fmt.Println(canceled.Id)
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _canceled = resend
      .emails
      .cancel("49a3999c-0ce1-4ea6-ab68-afcd6dc2e794")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          CancelEmailResponse canceled = resend
            .emails()
            .cancel("49a3999c-0ce1-4ea6-ab68-afcd6dc2e794");
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  await resend.EmailCancelAsync( new Guid( "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794" ) );
  ```

  ```bash cURL theme={null}
  curl -X POST 'https://api.resend.com/emails/49a3999c-0ce1-4ea6-ab68-afcd6dc2e794/cancel' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "email",
    "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Retrieve Attachment

> Retrieve a single attachment from a sent email.

## Path Parameters

<ParamField path="id" type="string" required>
  The Attachment ID.
</ParamField>

<ParamField path="email_id" type="string" required>
  The Email ID.
</ParamField>

<RequestExample>
  ```js Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.emails.attachments.get({
    id: '2a0c9ce0-3112-4728-976e-47ddcd16a318',
    emailId: '4ef9a417-02e9-4d39-ad75-9611e0fcc33c',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->emails->attachments->get(
    id: '2a0c9ce0-3112-4728-976e-47ddcd16a318',
    emailId: '4ef9a417-02e9-4d39-ad75-9611e0fcc33c'
  );
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  attachment = resend.Emails.Attachments.get(
    email_id='4ef9a417-02e9-4d39-ad75-9611e0fcc33c',
    attachment_id='2a0c9ce0-3112-4728-976e-47ddcd16a318'
  )
  ```

  ```ruby Ruby theme={null}
  require 'resend'

  Resend.api_key = 're_xxxxxxxxx'

  Resend::Emails::Attachments.get(
    id: "2a0c9ce0-3112-4728-976e-47ddcd16a318",
    email_id: "4ef9a417-02e9-4d39-ad75-9611e0fcc33c"
  )
  ```

  ```go Go theme={null}
  import (
  	"context"
  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	attachment, err := client.Emails.GetAttachmentWithContext(
  		context.TODO(),
  		"4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
  		"2a0c9ce0-3112-4728-976e-47ddcd16a318",
  	)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _email = resend
      .emails
      .get_attachment(
        "2a0c9ce0-3112-4728-976e-47ddcd16a318",
        "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
      )
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      AttachmentResponse attachment = resend.emails().getAttachment(
        "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
        "2a0c9ce0-3112-4728-976e-47ddcd16a318"
      );
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.EmailAttachmentRetrieveAsync(
    emailId: new Guid( "4ef9a417-02e9-4d39-ad75-9611e0fcc33c" ),
    attachmentId: new Guid( "2a0c9ce0-3112-4728-976e-47ddcd16a318" )
  );
  Console.WriteLine( "URL={0}", resp.Content.DownloadUrl );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/emails/4ef9a417-02e9-4d39-ad75-9611e0fcc33c/attachments/2a0c9ce0-3112-4728-976e-47ddcd16a318' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "attachment",
    "id": "2a0c9ce0-3112-4728-976e-47ddcd16a318",
    "filename": "avatar.png",
    "size": 4096,
    "content_type": "image/png",
    "content_disposition": "inline",
    "content_id": "img001",
    "download_url": "https://outbound-cdn.resend.com/4ef9a417-02e9-4d39-ad75-9611e0fcc33c/attachments/2a0c9ce0-3112-4728-976e-47ddcd16a318?some-params=example&signature=sig-123",
    "expires_at": "2025-10-17T14:29:41.521Z"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# List Attachments

> Retrieve a list of attachments from a sent email.

export const QueryParams = ({type, isRequired}) => {
  return <>
      <h2>Query Parameters</h2>

      {isRequired ? <ParamField query="limit" type="number">
          Number of {type} to retrieve.
          <ul>
            <li>
              Default value: <code>20</code>
            </li>
            <li>
              Maximum value: <code>100</code>
            </li>
            <li>
              Minimum value: <code>1</code>
            </li>
          </ul>
        </ParamField> : <>
          <p>
            Note that the <code>limit</code> parameter is <em>optional</em>. If
            you do not provide a <code>limit</code>, all {type} will be returned
            in a single response.
          </p>
          <ParamField query="limit" type="number">
            Number of {type} to retrieve.
            <ul>
              <li>
                Maximum value: <code>100</code>
              </li>
              <li>
                Minimum value: <code>1</code>
              </li>
            </ul>
          </ParamField>
        </>}

      <ParamField query="after" type="string">
        The ID <em>after</em> which we'll retrieve more {type} (for pagination).
        This ID will <em>not</em> be included in the returned list. Cannot be
        used with the
        <code>before</code> parameter.
      </ParamField>
      <ParamField query="before" type="string">
        The ID <em>before</em> which we'll retrieve more {type} (for
        pagination). This ID will <em>not</em> be included in the returned list.
        Cannot be used with the <code>after</code> parameter.
      </ParamField>
      <Info>
        You can only use either <code>after</code> or <code>before</code>{' '}
        parameter, not both. See our{' '}
        <a href="/api-reference/pagination">pagination guide</a> for more
        information.
      </Info>
    </>;
};

<QueryParams type="attachments" isRequired={false} />

## Path Parameters

<ParamField path="email_id" type="string" required>
  The Email ID.
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.emails.attachments.list({
    emailId: '4ef9a417-02e9-4d39-ad75-9611e0fcc33c',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->emails->attachments->list(
    emailId: '4ef9a417-02e9-4d39-ad75-9611e0fcc33c'
  );
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  attachments = resend.Emails.Attachments.list(
    email_id='4ef9a417-02e9-4d39-ad75-9611e0fcc33c'
  )
  ```

  ```ruby Ruby theme={null}
  require 'resend'

  Resend.api_key = 're_xxxxxxxxx'

  Resend::Emails::Attachments.list(
    email_id: "4ef9a417-02e9-4d39-ad75-9611e0fcc33c"
  )
  ```

  ```go Go theme={null}
  import (
  	"context"
  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	attachments, err := client.Emails.ListAttachmentsWithContext(
  		context.TODO(),
  		"4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
  	)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{list_opts::ListOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _email = resend
      .emails
      .list_attachments(
        "4ef9a417-02e9-4d39-ad75-9611e0fcc33c",
        ListOptions::default(),
      )
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      ListAttachmentsResponse response = resend.emails().listAttachments(
        "4ef9a417-02e9-4d39-ad75-9611e0fcc33c"
      );
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.EmailAttachmentListAsync( new Guid( "4ef9a417-02e9-4d39-ad75-9611e0fcc33c" ));
  Console.WriteLine( "Nr Attachments={0}", resp.Content.Data.Count );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/emails/4ef9a417-02e9-4d39-ad75-9611e0fcc33c/attachments' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "list",
    "has_more": false,
    "data": [
      {
        "id": "2a0c9ce0-3112-4728-976e-47ddcd16a318",
        "filename": "avatar.png",
        "size": 4096,
        "content_type": "image/png",
        "content_disposition": "inline",
        "content_id": "img001",
        "download_url": "https://outbound-cdn.resend.com/4ef9a417-02e9-4d39-ad75-9611e0fcc33c/attachments/2a0c9ce0-3112-4728-976e-47ddcd16a318?some-params=example&signature=sig-123",
        "expires_at": "2025-10-17T14:29:41.521Z"
      }
    ]
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Create Broadcast

> Create a new broadcast to send to your contacts.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Body Parameters

<ResendParamField body="segment_id" type="string" required>
  The ID of the segment you want to send to.

  <Info>
    Audiences are now called Segments. Follow the [Migration
    Guide](/dashboard/segments/migrating-from-audiences-to-segments).
  </Info>
</ResendParamField>

<ParamField body="from" type="string" required>
  Sender email address.

  To include a friendly name, use the format `"Your Name <sender@domain.com>"`.
</ParamField>

<ParamField body="subject" type="string" required>
  Email subject.
</ParamField>

<ResendParamField body="reply_to" type="string | string[]">
  Reply-to email address. For multiple addresses, send as an array of strings.
</ResendParamField>

<ParamField body="html" type="string">
  The HTML version of the message. You can include Contact Properties in the
  body of the Broadcast. Learn more about [Contact
  Properties](/dashboard/audiences/contacts).
</ParamField>

<ParamField body="text" type="string">
  The plain text version of the message. You can include Contact Properties in the body of the Broadcast. Learn more about [Contact Properties](/dashboard/audiences/contacts).

  <Info>
    If not provided, the HTML will be used to generate a plain text version. You
    can opt out of this behavior by setting value to an empty string.
  </Info>
</ParamField>

<ParamField body="react" type="React.ReactNode">
  The React component used to write the message. *Only available in the Node.js
  SDK.*
</ParamField>

<ParamField body="name" type="string">
  The friendly name of the broadcast. Only used for internal reference.
</ParamField>

<ResendParamField body="topic_id" type="string">
  <TopicBetaBanner />

  The topic ID that the broadcast will be scoped to.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.broadcasts.create({
    segmentId: '78261eea-8f8b-4381-83c6-79fa7120f1cf',
    from: 'Acme <onboarding@resend.dev>',
    subject: 'hello world',
    html: 'Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->broadcasts->create([
    'segment_id' => '78261eea-8f8b-4381-83c6-79fa7120f1cf',
    'from' => 'Acme <onboarding@resend.dev>',
    'subject' => 'hello world',
    'html' => 'Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}',
  ]);
  ```

  ```py Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  params: resend.Broadcasts.CreateParams = {
    "segment_id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
    "from": "Acme <onboarding@resend.dev>",
    "subject": "Hello, world!",
    "html": "Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}",
  }

  resend.Broadcasts.create(params)
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  params = {
    "segment_id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
    "from": "Acme <onboarding@resend.dev>",
    "subject": "hello world",
    "html": "Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}",
  }
  Resend::Broadcasts.create(params)
  ```

  ```go Go theme={null}
  import "fmt"
  import 	"github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  params := &resend.CreateBroadcastRequest{
    SegmentId: "78261eea-8f8b-4381-83c6-79fa7120f1cf",
    From:       "Acme <onboarding@resend.dev>",
    Html:       "Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}",
    Subject:    "Hello, world!",
  }

  broadcast, _ := client.Broadcasts.Create(params)
  ```

  ```rust Rust theme={null}
  use resend_rs::{types::CreateBroadcastOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let segment_id = "78261eea-8f8b-4381-83c6-79fa7120f1cf";
    let from = "Acme <onboarding@resend.dev>";
    let subject = "hello world";
    let html = "Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}";

    let opts = CreateBroadcastOptions::new(segment_id, from, subject).with_html(html);

    let _broadcast = resend.broadcasts.create(opts).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  Resend resend = new Resend("re_xxxxxxxxx");

  CreateBroadcastOptions params = CreateBroadcastOptions.builder()
      .segmentId("78261eea-8f8b-4381-83c6-79fa7120f1cf")
      .from("Acme <onboarding@resend.dev>")
      .subject("hello world")
      .html("Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}")
      .build();

  CreateBroadcastResponseSuccess data = resend.broadcasts().create(params);
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.BroadcastAddAsync(
      new BroadcastData()
      {
          DisplayName = "Example Broadcast",
          SegmentId = new Guid( "78261eea-8f8b-4381-83c6-79fa7120f1cf" ),
          From = "Acme <onboarding@resend.dev>",
          Subject = "Hello, world!",
          HtmlBody = "Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}",
      }
  );
  Console.WriteLine( "Broadcast Id={0}", resp.Content );
  ```

  ```bash cURL theme={null}
  curl -X POST 'https://api.resend.com/broadcasts' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "segment_id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
    "from": "Acme <onboarding@resend.dev>",
    "subject": "hello world",
    "html": "Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Send Broadcast

> Start sending broadcasts to your audience through the Resend API.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

<Note>You can send broadcasts only if they were created via the API.</Note>

## Path Parameters

<ResendParamField path="broadcast_id" type="string" required>
  The broadcast ID.
</ResendParamField>

## Body Parameters

<ResendParamField body="scheduled_at" type="string">
  Schedule email to be sent later. The date should be in natural language (e.g.:
  `in 1 min`) or ISO 8601 format (e.g: `2024-08-05T11:52:01.858Z`).
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.broadcasts.send(
    '559ac32e-9ef5-46fb-82a1-b76b840c0f7b',
    {
      scheduledAt: 'in 1 min',
    },
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->broadcasts->send('559ac32e-9ef5-46fb-82a1-b76b840c0f7b', [
    'scheduled_at' => 'in 1 min',
  ]);
  ```

  ```py Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  params: resend.Broadcasts.SendParams = {
    "broadcast_id": "559ac32e-9ef5-46fb-82a1-b76b840c0f7b",
    "scheduled_at": "in 1 min"
  }
  resend.Broadcasts.send(params)
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  params = {
    broadcast_id: "559ac32e-9ef5-46fb-82a1-b76b840c0f7b",
    scheduled_at: "in 1 min"
  }
  Resend::Broadcasts.send(params)
  ```

  ```go Go theme={null}
  import 	"github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  sendParams := &resend.SendBroadcastRequest{
    BroadcastId: "559ac32e-9ef5-46fb-82a1-b76b840c0f7b",
    ScheduledAt: "in 1 min",
  }

  sent, _ := client.Broadcasts.Send(sendParams)
  ```

  ```rust Rust theme={null}
  use resend_rs::{types::SendBroadcastOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let opts =
      SendBroadcastOptions::new("559ac32e-9ef5-46fb-82a1-b76b840c0f7b").with_scheduled_at("in 1 min");

    let _broadcast = resend.broadcasts.send(opts).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  Resend resend = new Resend("re_xxxxxxxxx");

  SendBroadcastOptions params = SendBroadcastOptions.builder()
      .scheduledAt("in 1 min")
      .build();

  SendBroadcastResponseSuccess data = resend.broadcasts().send(params,
      "498ee8e4-7aa2-4eb5-9f04-4194848049d1");
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  // Send now
  await resend.BroadcastSendAsync( new Guid( "559ac32e-9ef5-46fb-82a1-b76b840c0f7b" ) );

  // Send in 5 mins
  await resend.BroadcastScheduleAsync(
      new Guid( "559ac32e-9ef5-46fb-82a1-b76b840c0f7b" ),
      DateTime.UtcNow.AddMinutes( 5 ) );
  ```

  ```bash cURL theme={null}
  curl -X POST 'https://api.resend.com/broadcasts/559ac32e-9ef5-46fb-82a1-b76b840c0f7b/send' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "scheduled_at": "in 1 min"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Retrieve Broadcast

> Retrieve a single broadcast.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

You can retrieve broadcasts created via both this API and the Resend dashboard.

## Path Parameters

<ResendParamField path="broadcast_id" type="string" required>
  The broadcast ID.
</ResendParamField>

<Info>
  See all available `status` types in [the Broadcasts
  overview](/dashboard/broadcasts/introduction#understand-broadcast-statuses).
</Info>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.broadcasts.get(
    '559ac32e-9ef5-46fb-82a1-b76b840c0f7b',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->broadcasts->get('559ac32e-9ef5-46fb-82a1-b76b840c0f7b');
  ```

  ```py Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Broadcasts.get(id="559ac32e-9ef5-46fb-82a1-b76b840c0f7b")
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Broadcasts.get("559ac32e-9ef5-46fb-82a1-b76b840c0f7b")
  ```

  ```go Go theme={null}
  import 	"github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  broadcast, _ := client.Broadcasts.Get("559ac32e-9ef5-46fb-82a1-b76b840c0f7b")
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _broadcast = resend
      .broadcasts
      .get("559ac32e-9ef5-46fb-82a1-b76b840c0f7b")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  Resend resend = new Resend("re_xxxxxxxxx");

  GetBroadcastResponseSuccess data = resend.broadcasts().get("559ac32e-9ef5-46fb-82a1-b76b840c0f7b");
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.BroadcastRetrieveAsync( new Guid( "559ac32e-9ef5-46fb-82a1-b76b840c0f7b" ) );
  Console.WriteLine( "Broadcast name={0}", resp.Content.DisplayName );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/broadcasts/559ac32e-9ef5-46fb-82a1-b76b840c0f7b' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "broadcast",
    "id": "559ac32e-9ef5-46fb-82a1-b76b840c0f7b",
    "name": "Announcements",
    "audience_id": "78261eea-8f8b-4381-83c6-79fa7120f1cf", // now called segment_id
    "segment_id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
    "from": "Acme <onboarding@resend.dev>",
    "subject": "hello world",
    "reply_to": null,
    "preview_text": "Check out our latest announcements",
    "html": "<p>Hello {{{FIRST_NAME|there}}}!</p>",
    "text": "Hello {{{FIRST_NAME|there}}}!",
    "status": "draft",
    "created_at": "2024-12-01T19:32:22.980Z",
    "scheduled_at": null,
    "sent_at": null,
    "topic_id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# List Broadcasts

> Retrieve a list of broadcast.

export const QueryParams = ({type, isRequired}) => {
  return <>
      <h2>Query Parameters</h2>

      {isRequired ? <ParamField query="limit" type="number">
          Number of {type} to retrieve.
          <ul>
            <li>
              Default value: <code>20</code>
            </li>
            <li>
              Maximum value: <code>100</code>
            </li>
            <li>
              Minimum value: <code>1</code>
            </li>
          </ul>
        </ParamField> : <>
          <p>
            Note that the <code>limit</code> parameter is <em>optional</em>. If
            you do not provide a <code>limit</code>, all {type} will be returned
            in a single response.
          </p>
          <ParamField query="limit" type="number">
            Number of {type} to retrieve.
            <ul>
              <li>
                Maximum value: <code>100</code>
              </li>
              <li>
                Minimum value: <code>1</code>
              </li>
            </ul>
          </ParamField>
        </>}

      <ParamField query="after" type="string">
        The ID <em>after</em> which we'll retrieve more {type} (for pagination).
        This ID will <em>not</em> be included in the returned list. Cannot be
        used with the
        <code>before</code> parameter.
      </ParamField>
      <ParamField query="before" type="string">
        The ID <em>before</em> which we'll retrieve more {type} (for
        pagination). This ID will <em>not</em> be included in the returned list.
        Cannot be used with the <code>after</code> parameter.
      </ParamField>
      <Info>
        You can only use either <code>after</code> or <code>before</code>{' '}
        parameter, not both. See our{' '}
        <a href="/api-reference/pagination">pagination guide</a> for more
        information.
      </Info>
    </>;
};

<Info>
  See all available `status` types in [the Broadcasts
  overview](/dashboard/broadcasts/introduction#understand-broadcast-statuses).
</Info>

<QueryParams type="broadcasts" isRequired={false} />

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.broadcasts.list();
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->broadcasts->list();
  ```

  ```py Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Broadcasts.list()
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Broadcasts.list()
  ```

  ```go Go theme={null}
  import 	"github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  broadcasts, _ := client.Broadcasts.List()
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result, list_opts::ListOptions};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _broadcasts = resend.broadcasts.list(ListOptions::default()).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  Resend resend = new Resend("re_xxxxxxxxx");

  ListBroadcastsResponseSuccess data = resend.broadcasts().list();
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.BroadcastListAsync();
  Console.WriteLine( "Nr Broadcasts={0}", resp.Content.Count );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/broadcasts' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "list",
    "has_more": false,
    "data": [
      {
        "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
        "audience_id": "78261eea-8f8b-4381-83c6-79fa7120f1cf", // now called segment_id
        "segment_id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
        "status": "draft",
        "created_at": "2024-11-01T15:13:31.723Z",
        "scheduled_at": null,
        "sent_at": null,
        "topic_id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e"
      },
      {
        "id": "559ac32e-9ef5-46fb-82a1-b76b840c0f7b",
        "audience_id": "78261eea-8f8b-4381-83c6-79fa7120f1cf", // now called segment_id
        "segment_id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
        "status": "sent",
        "created_at": "2024-12-01T19:32:22.980Z",
        "scheduled_at": "2024-12-02T19:32:22.980Z",
        "sent_at": "2024-12-02T19:32:22.980Z",
        "topic_id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e"
      }
    ]
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Update Broadcast

> Update a broadcast to send to your contacts.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

<ResendParamField path="broadcast_id" type="string" required>
  The ID of the broadcast you want to update.
</ResendParamField>

## Body Parameters

<ResendParamField body="segment_id" type="string">
  The ID of the segment you want to send to.

  <Info>
    Audiences are now called Segments. Follow the [Migration
    Guide](/dashboard/segments/migrating-from-audiences-to-segments).
  </Info>
</ResendParamField>

<ParamField body="from" type="string">
  Sender email address.

  To include a friendly name, use the format `"Your Name <sender@domain.com>"`.
</ParamField>

<ParamField body="subject" type="string">
  Email subject.
</ParamField>

<ResendParamField body="reply_to" type="string | string[]">
  Reply-to email address. For multiple addresses, send as an array of strings.
</ResendParamField>

<ParamField body="html" type="string">
  The HTML version of the message.
</ParamField>

<ParamField body="text" type="string">
  The plain text version of the message.

  <Info>
    If not provided, the HTML will be used to generate a plain text version. You
    can opt out of this behavior by setting value to an empty string.
  </Info>
</ParamField>

<ParamField body="react" type="React.ReactNode">
  The React component used to write the message. *Only available in the Node.js
  SDK.*
</ParamField>

<ParamField body="name" type="string">
  The friendly name of the broadcast. Only used for internal reference.
</ParamField>

<ResendParamField body="topic_id" type="string">
  The topic ID that the broadcast will be scoped to.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.broadcasts.update(
    '49a3999c-0ce1-4ea6-ab68-afcd6dc2e794',
    {
      html: 'Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}',
    },
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->broadcasts->update('49a3999c-0ce1-4ea6-ab68-afcd6dc2e794', [
    'html' => 'Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}',
  ]);
  ```

  ```py Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  params: resend.Broadcasts.UpdateParams = {
    "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
    "html": "Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}"
  }

  resend.Broadcasts.update(params)
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  params = {
    "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
    "html": "Hi #{FIRST_NAME}, you can unsubscribe here: #{RESEND_UNSUBSCRIBE_URL}",
  }
  Resend::Broadcasts.update(params)
  ```

  ```go Go theme={null}
  import "fmt"
  import 	"github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  params := &resend.UpdateBroadcastRequest{
    Id: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
    Html: fmt.Sprintf("Hi %s, you can unsubscribe here: %s", FIRST_NAME, RESEND_UNSUBSCRIBE_URL),
  }

  broadcast, _ := client.Broadcasts.Update(params)
  ```

  ```rust Rust theme={null}
  use resend_rs::{types::UpdateBroadcastOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let id = "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794";
    let html = "Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}";

    let opts = UpdateBroadcastOptions::new().with_html(html);

    let _broadcast = resend.broadcasts.update(id, opts).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  Resend resend = new Resend("re_xxxxxxxxx");

  UpdateBroadcastOptions params = UpdateBroadcastOptions.builder()
      .id("49a3999c-0ce1-4ea6-ab68-afcd6dc2e794")
      .html("Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}")
      .build();

  UpdateBroadcastResponseSuccess data = resend.broadcasts().update(params);
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.BroadcastUpdateAsync(
      new Guid( "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794" ),
      new BroadcastUpdateData()
      {
          HtmlBody = "Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}",
      }
  );
  ```

  ```bash cURL theme={null}
  curl -X PATCH 'https://api.resend.com/broadcasts/49a3999c-0ce1-4ea6-ab68-afcd6dc2e794' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "html": "Hi {{{FIRST_NAME|there}}}, you can unsubscribe here: {{{RESEND_UNSUBSCRIBE_URL}}}"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Delete Broadcast

> Remove an existing broadcast.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

You can only delete broadcasts that are in the `draft` status. In addition, if you delete a broadcast that has already been scheduled to be sent, we will automatically cancel the scheduled delivery and it won't be sent.

## Path Parameters

<ResendParamField path="broadcast_id" type="string" required>
  The broadcast ID.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.broadcasts.remove(
    '559ac32e-9ef5-46fb-82a1-b76b840c0f7b',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->broadcasts->remove('559ac32e-9ef5-46fb-82a1-b76b840c0f7b');
  ```

  ```py Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Broadcasts.remove(id="559ac32e-9ef5-46fb-82a1-b76b840c0f7b")
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Broadcasts.remove("559ac32e-9ef5-46fb-82a1-b76b840c0f7b")
  ```

  ```go Go theme={null}
  import 	"github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  removed, _ := client.Broadcasts.Remove("559ac32e-9ef5-46fb-82a1-b76b840c0f7b")
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _deleted = resend
      .broadcasts
      .delete("559ac32e-9ef5-46fb-82a1-b76b840c0f7b")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  Resend resend = new Resend("re_xxxxxxxxx");

  RemoveBroadcastResponseSuccess data = resend.broadcasts().remove("559ac32e-9ef5-46fb-82a1-b76b840c0f7b");
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  await resend.BroadcastDeleteAsync( new Guid( "559ac32e-9ef5-46fb-82a1-b76b840c0f7b" ) );
  ```

  ```bash cURL theme={null}
  curl -X DELETE 'https://api.resend.com/broadcasts/559ac32e-9ef5-46fb-82a1-b76b840c0f7b' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "broadcast",
    "id": "559ac32e-9ef5-46fb-82a1-b76b840c0f7b",
    "deleted": true
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Create Contact

> Create a contact.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Body Parameters

<ParamField body="email" type="string" required>
  The email address of the contact.
</ParamField>

<ResendParamField body="first_name" type="string">
  The first name of the contact.
</ResendParamField>

<ResendParamField body="last_name" type="string">
  The last name of the contact.
</ResendParamField>

<ParamField body="unsubscribed" type="boolean">
  The Contact's global subscription status. If set to `true`, the contact will
  be unsubscribed from all Broadcasts.
</ParamField>

<ParamField body="properties" type="object">
  A map of custom property keys and values to create.

  <Expandable defaultOpen="true" title="custom properties">
    <ParamField body="key" type="string" required>
      The property key.
    </ParamField>

    <ParamField body="value" type="string" required>
      The property value.
    </ParamField>
  </Expandable>
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.contacts.create({
    email: 'steve.wozniak@gmail.com',
    firstName: 'Steve',
    lastName: 'Wozniak',
    unsubscribed: false,
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->contacts->create(
    parameters: [
      'email' => 'steve.wozniak@gmail.com',
      'first_name' => 'Steve',
      'last_name' => 'Wozniak',
      'unsubscribed' => false
    ]
  );
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  params: resend.Contacts.CreateParams = {
    "email": "steve.wozniak@gmail.com",
    "first_name": "Steve",
    "last_name": "Wozniak",
    "unsubscribed": False,
  }

  resend.Contacts.create(params)
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  params = {
    "email": "steve.wozniak@gmail.com",
    "first_name": "Steve",
    "last_name": "Wozniak",
    "unsubscribed": false,
  }

  Resend::Contacts.create(params)
  ```

  ```go Go theme={null}
  import "github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  params := &resend.CreateContactRequest{
    Email:        "steve.wozniak@gmail.com",
    FirstName:    "Steve",
    LastName:     "Wozniak",
    Unsubscribed: false,
  }

  contact, err := client.Contacts.Create(params)
  ```

  ```rust Rust theme={null}
  use resend_rs::{types::CreateContactOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let contact = CreateContactOptions::new("steve.wozniak@gmail.com")
      .with_first_name("Steve")
      .with_last_name("Wozniak")
      .with_unsubscribed(false);

    let _contact = resend.contacts.create(contact).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          CreateContactOptions params = CreateContactOptions.builder()
                  .email("steve.wozniak@gmail.com")
                  .firstName("Steve")
                  .lastName("Wozniak")
                  .unsubscribed(false)
                  .build();

          CreateContactResponseSuccess data = resend.contacts().create(params);
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.ContactAddAsync(
      new ContactData()
      {
          Email = "steve.wozniak@gmail.com",
          FirstName = "Steve",
          LastName = "Wozniak",
          IsUnsubscribed = false,
      }
  );
  Console.WriteLine( "Contact Id={0}", resp.Content );
  ```

  ```bash cURL theme={null}
  curl -X POST 'https://api.resend.com/contacts' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "email": "steve.wozniak@gmail.com",
    "first_name": "Steve",
    "last_name": "Wozniak",
    "unsubscribed": false
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "contact",
    "id": "479e3145-dd38-476b-932c-529ceb705947"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Retrieve Contact

> Retrieve a single contact.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

Either `id` or `email` must be provided.

<ParamField path="id" type="string">
  The Contact ID.
</ParamField>

<ParamField path="email" type="string">
  The Contact Email.
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  // Get by contact id
  const { data, error } = await resend.contacts.get({
    id: 'e169aa45-1ecf-4183-9955-b1499d5701d3',
  });

  // Get by contact email
  const { data, error } = await resend.contacts.get({
    email: 'steve.wozniak@gmail.com',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  // Get by contact id
  $resend->contacts->get(
    id: 'e169aa45-1ecf-4183-9955-b1499d5701d3'
  );

  // Get by contact email
  $resend->contacts->get(
    email: 'steve.wozniak@gmail.com'
  );
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  # Get by contact id
  resend.Contacts.get(
    id="e169aa45-1ecf-4183-9955-b1499d5701d3",
  )

  # Get by contact email
  resend.Contacts.get(
    email="steve.wozniak@gmail.com",
  )
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  # Get by contact id
  params = {
    "id": "e169aa45-1ecf-4183-9955-b1499d5701d3",
  }

  Resend::Contacts.get(params)

  # Get by contact email
  params = {
    "email": "steve.wozniak@gmail.com",
  }

  Resend::Contacts.get(params)
  ```

  ```go Go theme={null}
  import "github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  // Get by contact id
  id := "e169aa45-1ecf-4183-9955-b1499d5701d3"
  contact, err := client.Contacts.Get(id)

  // Get by contact email
  email := "steve.wozniak@gmail.com"
  contact, err := client.Contacts.Get(email)
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    // Get by contact id
    let _contact = resend
      .contacts
      .get("e169aa45-1ecf-4183-9955-b1499d5701d3")
      .await?;

    // Get by contact email
    let _contact = resend
      .contacts
      .get("steve.wozniak@gmail.com")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          // Get by contact id
          GetContactOptions params = GetContactOptions.builder()
                  .id("e169aa45-1ecf-4183-9955-b1499d5701d3")
                  .build();

          // Get by contact email
          GetContactOptions params = GetContactOptions.builder()
                  .email("steve.wozniak@gmail.com")
                  .build();

          GetContactResponseSuccess data = resend.contacts().get(params);
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  // Get by contact id
  var resp1 = await resend.ContactRetrieveAsync(
      contactId: new Guid( "e169aa45-1ecf-4183-9955-b1499d5701d3" )
  );

  // Get by contact email
  var resp2 = await resend.ContactRetrieveByEmailAsync(
      email: "steve.wozniak@gmail.com"
  );

  Console.WriteLine( "Contact Email={0}", resp2.Content.Email );
  ```

  ```bash cURL theme={null}
  # Get by contact id
  curl -X GET 'https://api.resend.com/contacts/e169aa45-1ecf-4183-9955-b1499d5701d3' \
       -H 'Authorization: Bearer re_xxxxxxxxx'

  # Get by contact email
  curl -X GET 'https://api.resend.com/contacts/steve.wozniak@gmail.com' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "contact",
    "id": "e169aa45-1ecf-4183-9955-b1499d5701d3",
    "email": "steve.wozniak@gmail.com",
    "first_name": "Steve",
    "last_name": "Wozniak",
    "created_at": "2023-10-06T23:47:56.678Z",
    "unsubscribed": false,
    "properties": {
      "company_name": "Acme Corp",
      "department": "Engineering"
    }
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# List Contacts

> Show all contacts.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

export const QueryParams = ({type, isRequired}) => {
  return <>
      <h2>Query Parameters</h2>

      {isRequired ? <ParamField query="limit" type="number">
          Number of {type} to retrieve.
          <ul>
            <li>
              Default value: <code>20</code>
            </li>
            <li>
              Maximum value: <code>100</code>
            </li>
            <li>
              Minimum value: <code>1</code>
            </li>
          </ul>
        </ParamField> : <>
          <p>
            Note that the <code>limit</code> parameter is <em>optional</em>. If
            you do not provide a <code>limit</code>, all {type} will be returned
            in a single response.
          </p>
          <ParamField query="limit" type="number">
            Number of {type} to retrieve.
            <ul>
              <li>
                Maximum value: <code>100</code>
              </li>
              <li>
                Minimum value: <code>1</code>
              </li>
            </ul>
          </ParamField>
        </>}

      <ParamField query="after" type="string">
        The ID <em>after</em> which we'll retrieve more {type} (for pagination).
        This ID will <em>not</em> be included in the returned list. Cannot be
        used with the
        <code>before</code> parameter.
      </ParamField>
      <ParamField query="before" type="string">
        The ID <em>before</em> which we'll retrieve more {type} (for
        pagination). This ID will <em>not</em> be included in the returned list.
        Cannot be used with the <code>after</code> parameter.
      </ParamField>
      <Info>
        You can only use either <code>after</code> or <code>before</code>{' '}
        parameter, not both. See our{' '}
        <a href="/api-reference/pagination">pagination guide</a> for more
        information.
      </Info>
    </>;
};

## Path Parameters

<ResendParamField path="segment_id" type="string">
  The Segment ID to filter contacts by. If provided, only contacts in this Segment will be returned.
</ResendParamField>

<QueryParams type="contacts" isRequired={false} />

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.contacts.list();
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->contacts->list();
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Contacts.list()
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Contacts.list()
  ```

  ```go Go theme={null}
  import "github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  contacts, err := client.Contacts.List()
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result, list_opts::ListOptions};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _contacts = resend
      .contacts
      .list(
          ListOptions::default(),
      )
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          ListContactsResponseSuccess data = resend.contacts().list();
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.ContactListAsync();
  Console.WriteLine( "Nr Contacts={0}", resp.Content.Data.Count );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/contacts' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "list",
    "has_more": false,
    "data": [
      {
        "id": "e169aa45-1ecf-4183-9955-b1499d5701d3",
        "email": "steve.wozniak@gmail.com",
        "first_name": "Steve",
        "last_name": "Wozniak",
        "created_at": "2023-10-06T23:47:56.678Z",
        "unsubscribed": false,
        "properties": {
          "company_name": "Acme Corp",
          "department": "Engineering"
        }
      }
    ]
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Update Contact

> Update an existing contact.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

Either `id` or `email` must be provided.

<ParamField path="id" type="string">
  The Contact ID.
</ParamField>

<ParamField path="email" type="string">
  The Contact Email.
</ParamField>

## Body Parameters

<ResendParamField body="first_name" type="string">
  The first name of the contact.
</ResendParamField>

<ResendParamField body="last_name" type="string">
  The last name of the contact.
</ResendParamField>

<ParamField body="unsubscribed" type="boolean">
  The Contact's global subscription status. If set to `true`, the contact will
  be unsubscribed from all Broadcasts.
</ParamField>

<ParamField body="properties" type="object">
  A map of custom property keys and values to update.

  <Expandable defaultOpen="true" title="custom properties">
    <ParamField body="key" type="string" required>
      The property key.
    </ParamField>

    <ParamField body="value" type="string" required>
      The property value.
    </ParamField>
  </Expandable>
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  // Update by contact id
  const { data, error } = await resend.contacts.update({
    id: 'e169aa45-1ecf-4183-9955-b1499d5701d3',
    unsubscribed: true,
  });

  // Update by contact email
  const { data, error } = await resend.contacts.update({
    email: 'acme@example.com',
    unsubscribed: true,
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  // Update by contact id
  $resend->contacts->update(
    id: 'e169aa45-1ecf-4183-9955-b1499d5701d3',
    parameters: [
      'unsubscribed' => true
    ]
  );

  // Update by contact email
  $resend->contacts->update(
    email: 'acme@example.com',
    parameters: [
      'unsubscribed' => true
    ]
  );
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  # Update by contact id
  params: resend.Contacts.UpdateParams = {
    "id": "e169aa45-1ecf-4183-9955-b1499d5701d3",
    "unsubscribed": True,
  }

  resend.Contacts.update(params)

  # Update by contact email
  params: resend.Contacts.UpdateParams = {
    "email": "acme@example.com",
    "unsubscribed": True,
  }

  resend.Contacts.update(params)
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  # Update by contact id
  params = {
    "id": "e169aa45-1ecf-4183-9955-b1499d5701d3",
    "unsubscribed": true,
  }

  Resend::Contacts.update(params)

  # Update by contact email
  params = {
    "email": "acme@example.com",
    "unsubscribed": true,
  }

  Resend::Contacts.update(params)
  ```

  ```go Go theme={null}
  import "github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  // Update by contact id
  params := &resend.UpdateContactRequest{
    Id:           "e169aa45-1ecf-4183-9955-b1499d5701d3",
    Unsubscribed: true,
  }
  params.SetUnsubscribed(true)

  contact, err := client.Contacts.Update(params)

  // Update by contact email
  params = &resend.UpdateContactRequest{
    Email:        "acme@example.com",
    Unsubscribed: true,
  }
  params.SetUnsubscribed(true)

  contact, err := client.Contacts.Update(params)
  ```

  ```rust Rust theme={null}
  use resend_rs::{types::ContactChanges, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let changes = ContactChanges::new().with_unsubscribed(true);

    // Update by contact id
    let _contact = resend
      .contacts
      .update("e169aa45-1ecf-4183-9955-b1499d5701d3", changes.clone())
      .await?;

    // Update by contact email
    let _contact = resend
      .contacts
      .update("acme@example.com", changes)
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          // Update by contact id
          UpdateContactOptions params = UpdateContactOptions.builder()
                  .id("e169aa45-1ecf-4183-9955-b1499d5701d3")
                  .unsubscribed(true)
                  .build();

          // Update by contact email
          UpdateContactOptions params = UpdateContactOptions.builder()
                  .email("acme@example.com")
                  .unsubscribed(true)
                  .build();

          UpdateContactResponseSuccess data = resend.contacts().update(params);
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  // By Id
  await resend.ContactUpdateAsync(
      contactId: new Guid( "e169aa45-1ecf-4183-9955-b1499d5701d3" ),
      new ContactData()
      {
          FirstName = "Stevie",
          LastName = "Wozniaks",
          IsUnsubscribed = true,
      }
  );

  // By Email
  await resend.ContactUpdateByEmailAsync(
      "acme@example.com",
      new ContactData()
      {
          FirstName = "Stevie",
          LastName = "Wozniaks",
          IsUnsubscribed = true,
      }
  );
  ```

  ```bash cURL theme={null}
  # Update by contact id
  curl -X PATCH 'https://api.resend.com/contacts/520784e2-887d-4c25-b53c-4ad46ad38100' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "unsubscribed": true
  }'

  # Update by contact email
  curl -X PATCH 'https://api.resend.com/contacts/acme@example.com' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "unsubscribed": true
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "contact",
    "id": "479e3145-dd38-476b-932c-529ceb705947"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Delete Contact

> Remove an existing contact.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

Either `id` or `email` must be provided.

<ParamField path="id" type="string">
  The Contact ID.
</ParamField>

<ParamField path="email" type="string">
  The Contact email.
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  // Delete by contact id
  const { data, error } = await resend.contacts.remove({
    id: '520784e2-887d-4c25-b53c-4ad46ad38100',
  });

  // Delete by contact email
  const { data, error } = await resend.contacts.remove({
    email: 'acme@example.com',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  // Delete by contact id
  $resend->contacts->remove(
    id: '520784e2-887d-4c25-b53c-4ad46ad38100'
  );

  // Delete by contact email
  $resend->contacts->remove(
    email: 'acme@example.com'
  );
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  # Delete by contact id
  resend.Contacts.remove(
    id="520784e2-887d-4c25-b53c-4ad46ad38100"
  )

  # Delete by contact email
  resend.Contacts.remove(
    email="acme@example.com"
  )
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  # Delete by contact id
  Resend::Contacts.remove(
    id: "520784e2-887d-4c25-b53c-4ad46ad38100"
  )

  # Delete by contact email
  Resend::Contacts.remove(
    email: "acme@example.com"
  )
  ```

  ```go Go theme={null}
  import "github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  // Delete by contact id
  removed, err := client.Contacts.Remove(
    "520784e2-887d-4c25-b53c-4ad46ad38100"
  )

  // Delete by contact email
  removed, err := client.Contacts.Remove(
    "acme@example.com"
  )
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    // Delete by contact id
    let _deleted = resend
      .contacts
      .delete("520784e2-887d-4c25-b53c-4ad46ad38100")
      .await?;

    // Delete by contact email
    let _deleted = resend
      .contacts
      .delete("acme@example.com")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          // Delete by contact id
          resend.contacts().remove(ContactRequestOptions.builder()
                          .id("520784e2-887d-4c25-b53c-4ad46ad38100")
                          .build());

          // Delete by contact email
          resend.contacts().remove(ContactRequestOptions.builder()
                          .email("acme@example.com")
                          .build());
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  // By Id
  await resend.ContactDeleteAsync(
      contactId: new Guid( "520784e2-887d-4c25-b53c-4ad46ad38100" )
  );

  // By Email
  await resend.ContactDeleteByEmailAsync(
      "acme@example.com"
  );
  ```

  ```bash cURL theme={null}
  # Delete by contact id
  curl -X DELETE 'https://api.resend.com/contacts/520784e2-887d-4c25-b53c-4ad46ad38100' \
       -H 'Authorization: Bearer re_xxxxxxxxx'

  # Deleted by contact email
  curl -X DELETE 'https://api.resend.com/contacts/acme@example.com' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "contact",
    "contact": "520784e2-887d-4c25-b53c-4ad46ad38100",
    "deleted": true
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Add Contact to Segment

> Add an existing contact to a segment.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

<SegmentsBetaBanner />

## Path Parameters

Either `id` or `email` must be provided.

<ParamField path="id" type="string">
  The Contact ID.
</ParamField>

<ParamField path="email" type="string">
  The Contact Email.
</ParamField>

<ResendParamField path="segment_id" type="string" required>
  The Segment ID.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  // Add by contact id
  const { data, error } = await resend.contacts.segments.add({
    contactId: 'e169aa45-1ecf-4183-9955-b1499d5701d3',
    segmentId: '78261eea-8f8b-4381-83c6-79fa7120f1cf',
  });

  // Add by contact email
  const { data, error } = await resend.contacts.segments.add({
    email: 'steve.wozniak@gmail.com',
    segmentId: '78261eea-8f8b-4381-83c6-79fa7120f1cf',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  // Add by contact id
  $resend->contacts->segments->add(
    contact: 'e169aa45-1ecf-4183-9955-b1499d5701d3',
    segmentId: '78261eea-8f8b-4381-83c6-79fa7120f1cf'
  );

  // Add by contact email
  $resend->contacts->segments->add(
    contact: 'steve.wozniak@gmail.com',
    segmentId: '78261eea-8f8b-4381-83c6-79fa7120f1cf'
  );
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  # Add by contact id
  params = {
      "segment_id": '78261eea-8f8b-4381-83c6-79fa7120f1cf',
      "contact_id": 'e169aa45-1ecf-4183-9955-b1499d5701d3',
  }

  response = resend.Contacts.Segments.add(params)
  ```

  ```ruby Ruby theme={null}
  require 'resend'

  Resend.api_key = 're_xxxxxxxxx'

  # Add by contact id
  result = Resend::Contacts::Segments.add(
    contact_id: 'e169aa45-1ecf-4183-9955-b1499d5701d3',
    segment_id: '78261eea-8f8b-4381-83c6-79fa7120f1cf'
  )

  # Add by contact email
  result = Resend::Contacts::Segments.add(
    email: 'steve.wozniak@gmail.com',
    segment_id: '78261eea-8f8b-4381-83c6-79fa7120f1cf'
  )
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	// Add by contact id
  	addParams := &resend.AddContactSegmentRequest{
  		ContactId: "e169aa45-1ecf-4183-9955-b1499d5701d3",
  		SegmentId: "78261eea-8f8b-4381-83c6-79fa7120f1cf",
  	}

  	response, err := client.Contacts.Segments.AddWithContext(ctx, addParams)
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(response)

  	// Add by contact email
  	addByEmailParams := &resend.AddContactSegmentRequest{
  		Email:     "steve.wozniak@gmail.com",
  		SegmentId: "78261eea-8f8b-4381-83c6-79fa7120f1cf",
  	}

  	response, err = client.Contacts.Segments.AddWithContext(ctx, addByEmailParams)
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(response)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    // Update by contact id
    let _contact = resend
      .contacts
      .add_contact_segment(
        "e169aa45-1ecf-4183-9955-b1499d5701d3",
        "78261eea-8f8b-4381-83c6-79fa7120f1cf",
      )
      .await?;

    // // Update by contact email
    let _contact = resend
      .contacts
      .add_contact_segment(
        "steve.wozniak@gmail.com",
        "78261eea-8f8b-4381-83c6-79fa7120f1cf",
      )
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      // Add by contact id
      AddContactToSegmentOptions optionsById = AddContactToSegmentOptions.builder()
        .id("e169aa45-1ecf-4183-9955-b1499d5701d3")
        .segmentId("78261eea-8f8b-4381-83c6-79fa7120f1cf")
        .build();

      resend.contacts().segments().add(optionsById);

      // Add by contact email
      AddContactToSegmentOptions optionsByEmail = AddContactToSegmentOptions.builder()
        .email("steve.wozniak@gmail.com")
        .segmentId("78261eea-8f8b-4381-83c6-79fa7120f1cf")
        .build();

      resend.contacts().segments().add(optionsByEmail);
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  await resend.ContactAddToSegmentAsync(
      contactId: new Guid( "e169aa45-1ecf-4183-9955-b1499d5701d3" ),
      segmentId: new Guid( "78261eea-8f8b-4381-83c6-79fa7120f1cf" )
  );
  ```

  ```bash cURL theme={null}
  // Update by contact id
  curl -X POST 'https://api.resend.com/contacts/e169aa45-1ecf-4183-9955-b1499d5701d3/segments/78261eea-8f8b-4381-83c6-79fa7120f1cf' \
       -H 'Authorization: Bearer re_xxxxxxxxx'

  // Update by contact email
  curl -X POST 'https://api.resend.com/contacts/steve.wozniak@gmail.com/segments/78261eea-8f8b-4381-83c6-79fa7120f1cf' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "id": "78261eea-8f8b-4381-83c6-79fa7120f1cf"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# List Contact Segments

> Retrieve a list of segments that a contact is part of.

export const QueryParams = ({type, isRequired}) => {
  return <>
      <h2>Query Parameters</h2>

      {isRequired ? <ParamField query="limit" type="number">
          Number of {type} to retrieve.
          <ul>
            <li>
              Default value: <code>20</code>
            </li>
            <li>
              Maximum value: <code>100</code>
            </li>
            <li>
              Minimum value: <code>1</code>
            </li>
          </ul>
        </ParamField> : <>
          <p>
            Note that the <code>limit</code> parameter is <em>optional</em>. If
            you do not provide a <code>limit</code>, all {type} will be returned
            in a single response.
          </p>
          <ParamField query="limit" type="number">
            Number of {type} to retrieve.
            <ul>
              <li>
                Maximum value: <code>100</code>
              </li>
              <li>
                Minimum value: <code>1</code>
              </li>
            </ul>
          </ParamField>
        </>}

      <ParamField query="after" type="string">
        The ID <em>after</em> which we'll retrieve more {type} (for pagination).
        This ID will <em>not</em> be included in the returned list. Cannot be
        used with the
        <code>before</code> parameter.
      </ParamField>
      <ParamField query="before" type="string">
        The ID <em>before</em> which we'll retrieve more {type} (for
        pagination). This ID will <em>not</em> be included in the returned list.
        Cannot be used with the <code>after</code> parameter.
      </ParamField>
      <Info>
        You can only use either <code>after</code> or <code>before</code>{' '}
        parameter, not both. See our{' '}
        <a href="/api-reference/pagination">pagination guide</a> for more
        information.
      </Info>
    </>;
};

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

Either `id` or `email` must be provided.

<ParamField path="id" type="string">
  The Contact ID.
</ParamField>

<ParamField path="email" type="string">
  The Contact Email.
</ParamField>

<QueryParams type="segments" isRequired={false} />

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.contacts.segments.list({
    id: 'e169aa45-1ecf-4183-9955-b1499d5701d3',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->contacts->segments->list(
    contactId: 'e169aa45-1ecf-4183-9955-b1499d5701d3'
  );
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  params = {
      "contact_id": 'e169aa45-1ecf-4183-9955-b1499d5701d3',
  }

  segments = resend.Contacts.Segments.list(params)
  ```

  ```ruby Ruby theme={null}
  require 'resend'

  Resend.api_key = 're_xxxxxxxxx'

  segments = Resend::Contacts::Segments.list(
    contact_id: 'e169aa45-1ecf-4183-9955-b1499d5701d3'
  )
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	listParams := &resend.ListContactSegmentsRequest{
  		ContactId: "e169aa45-1ecf-4183-9955-b1499d5701d3",
  	}

  	segments, err := client.Contacts.Segments.ListWithContext(ctx, listParams)
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(segments)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result, list_opts::ListOptions};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _contacts = resend
      .contacts
      .list_contact_segment(
        "e169aa45-1ecf-4183-9955-b1499d5701d3",
        ListOptions::default()
      )
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      resend.contacts().segments().list("e169aa45-1ecf-4183-9955-b1499d5701d3");
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.ContactListSegmentsAsync( new Guid( "e169aa45-1ecf-4183-9955-b1499d5701d3" ));
  Console.WriteLine( "Nr Segments={0}", resp.Content.Data.Count );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/contacts/e169aa45-1ecf-4183-9955-b1499d5701d3/segments' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "list",
    "data": [
      {
        "id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
        "name": "Registered Users",
        "created_at": "2023-10-06T22:59:55.977Z"
      }
    ],
    "has_more": false
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Delete Contact Segment

> Remove an existing contact from a segment.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

Either `id` or `email` must be provided.

<ParamField path="id" type="string">
  The Contact ID.
</ParamField>

<ParamField path="email" type="string">
  The Contact Email.
</ParamField>

<ResendParamField path="segment_id" type="string" required>
  The Segment ID.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  // Remove by contact id
  const { data, error } = await resend.contacts.segments.remove({
    id: 'e169aa45-1ecf-4183-9955-b1499d5701d3',
    segmentId: '78261eea-8f8b-4381-83c6-79fa7120f1cf',
  });

  // Remove by contact email
  const { data, error } = await resend.contacts.segments.remove({
    email: 'steve.wozniak@gmail.com',
    segmentId: '78261eea-8f8b-4381-83c6-79fa7120f1cf',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  // Remove by contact id
  $resend->contacts->segments->remove(
    contact: 'e169aa45-1ecf-4183-9955-b1499d5701d3',
    segmentId: '78261eea-8f8b-4381-83c6-79fa7120f1cf'
  );

  // Remove by contact email
  $resend->contacts->segments->remove(
    contact: 'steve.wozniak@gmail.com',
    segmentId: '78261eea-8f8b-4381-83c6-79fa7120f1cf'
  );
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  # Remove by contact id
  params = {
      "segment_id": '78261eea-8f8b-4381-83c6-79fa7120f1cf',
      "contact_id": 'e169aa45-1ecf-4183-9955-b1499d5701d3',
  }

  response = resend.Contacts.Segments.remove(params)
  ```

  ```ruby Ruby theme={null}
  require 'resend'

  Resend.api_key = 're_xxxxxxxxx'

  # Remove by contact id
  removed = Resend::Contacts::Segments.remove(
    contact_id: 'e169aa45-1ecf-4183-9955-b1499d5701d3',
    segment_id: '78261eea-8f8b-4381-83c6-79fa7120f1cf'
  )

  # Remove by contact email
  removed = Resend::Contacts::Segments.remove(
    email: 'steve.wozniak@gmail.com',
    segment_id: '78261eea-8f8b-4381-83c6-79fa7120f1cf'
  )
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	// Remove by contact id
  	removeParams := &resend.RemoveContactSegmentRequest{
  		ContactId: "e169aa45-1ecf-4183-9955-b1499d5701d3",
  		SegmentId: "78261eea-8f8b-4381-83c6-79fa7120f1cf",
  	}

  	response, err := client.Contacts.Segments.RemoveWithContext(ctx, removeParams)
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(response)

  	// Remove by contact email
  	removeByEmailParams := &resend.RemoveContactSegmentRequest{
  		Email:     "steve.wozniak@gmail.com",
  		SegmentId: "78261eea-8f8b-4381-83c6-79fa7120f1cf",
  	}

  	response, err = client.Contacts.Segments.RemoveWithContext(ctx, removeByEmailParams)
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(response)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    // Update by contact id
    let _contact = resend
      .contacts
      .delete_contact_segment(
        "e169aa45-1ecf-4183-9955-b1499d5701d3",
        "78261eea-8f8b-4381-83c6-79fa7120f1cf",
      )
      .await?;

    // // Update by contact email
    let _contact = resend
      .contacts
      .delete_contact_segment(
        "steve.wozniak@gmail.com",
        "78261eea-8f8b-4381-83c6-79fa7120f1cf",
      )
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      // Remove by contact id
      RemoveContactFromSegmentOptions optionsById = RemoveContactFromSegmentOptions.builder()
        .id("e169aa45-1ecf-4183-9955-b1499d5701d3")
        .segmentId("78261eea-8f8b-4381-83c6-79fa7120f1cf")
        .build();

      resend.contacts().segments().remove(optionsById);

      // Remove by contact email
      RemoveContactFromSegmentOptions optionsByEmail = RemoveContactFromSegmentOptions.builder()
        .email("steve.wozniak@gmail.com")
        .segmentId("78261eea-8f8b-4381-83c6-79fa7120f1cf")
        .build();

      resend.contacts().segments().remove(optionsByEmail);
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  await resend.ContactRemoveFromSegmentAsync(
      contactId: new Guid( "e169aa45-1ecf-4183-9955-b1499d5701d3" ),
      segmentId: new Guid( "78261eea-8f8b-4381-83c6-79fa7120f1cf" )
  );
  ```

  ```bash cURL theme={null}
  // Update by contact id
  curl -X DELETE 'https://api.resend.com/contacts/e169aa45-1ecf-4183-9955-b1499d5701d3/segments/78261eea-8f8b-4381-83c6-79fa7120f1cf' \
       -H 'Authorization: Bearer re_xxxxxxxxx'

  // Update by contact email
  curl -X DELETE 'https://api.resend.com/contacts/steve.wozniak@gmail.com/segments/78261eea-8f8b-4381-83c6-79fa7120f1cf' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
    "deleted": true
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Retrieve Contact Topics

> Retrieve a list of topics subscriptions for a contact.

export const QueryParams = ({type, isRequired}) => {
  return <>
      <h2>Query Parameters</h2>

      {isRequired ? <ParamField query="limit" type="number">
          Number of {type} to retrieve.
          <ul>
            <li>
              Default value: <code>20</code>
            </li>
            <li>
              Maximum value: <code>100</code>
            </li>
            <li>
              Minimum value: <code>1</code>
            </li>
          </ul>
        </ParamField> : <>
          <p>
            Note that the <code>limit</code> parameter is <em>optional</em>. If
            you do not provide a <code>limit</code>, all {type} will be returned
            in a single response.
          </p>
          <ParamField query="limit" type="number">
            Number of {type} to retrieve.
            <ul>
              <li>
                Maximum value: <code>100</code>
              </li>
              <li>
                Minimum value: <code>1</code>
              </li>
            </ul>
          </ParamField>
        </>}

      <ParamField query="after" type="string">
        The ID <em>after</em> which we'll retrieve more {type} (for pagination).
        This ID will <em>not</em> be included in the returned list. Cannot be
        used with the
        <code>before</code> parameter.
      </ParamField>
      <ParamField query="before" type="string">
        The ID <em>before</em> which we'll retrieve more {type} (for
        pagination). This ID will <em>not</em> be included in the returned list.
        Cannot be used with the <code>after</code> parameter.
      </ParamField>
      <Info>
        You can only use either <code>after</code> or <code>before</code>{' '}
        parameter, not both. See our{' '}
        <a href="/api-reference/pagination">pagination guide</a> for more
        information.
      </Info>
    </>;
};

## Path Parameters

Either `id` or `email` must be provided.

<ParamField path="id" type="string">
  The Contact ID.
</ParamField>

<ParamField path="email" type="string">
  The Contact Email.
</ParamField>

<QueryParams type="topics" isRequired={false} />

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  // Get by contact id
  const { data, error } = await resend.contacts.topics.list({
    id: 'e169aa45-1ecf-4183-9955-b1499d5701d3',
  });

  // Get by contact email
  const { data, error } = await resend.contacts.topics.list({
    email: 'steve.wozniak@gmail.com',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  // Get by contact id
  $resend->contacts->topics->get('e169aa45-1ecf-4183-9955-b1499d5701d3');

  // Get by contact email
  $resend->contacts->topics->get('steve.wozniak@gmail.com');
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  # Get by contact id
  topics = resend.Contacts.Topics.list(contact_id='e169aa45-1ecf-4183-9955-b1499d5701d3')

  # Get by contact email
  topics = resend.Contacts.Topics.list(email='steve.wozniak@gmail.com')
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  # Get by contact id
  contact_topics = Resend::Contacts::Topics.list(id: "e169aa45-1ecf-4183-9955-b1499d5701d3")

  # Get by contact email
  contact_topics = Resend::Contacts::Topics.list(id: "steve.wozniak@gmail.com")
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	// Get by contact id
  	topics, err := client.Contacts.Topics.ListWithContext(ctx, &resend.ListContactTopicsRequest{
  		ContactId: "e169aa45-1ecf-4183-9955-b1499d5701d3",
  	})
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(topics)

  	// Get by contact email
  	topics, err = client.Contacts.Topics.ListWithContext(ctx, &resend.ListContactTopicsRequest{
  		Email: "steve.wozniak@gmail.com",
  	})
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(topics)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{list_opts::ListOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _topics = resend
      .contacts
      .get_contact_topics(
        "e169aa45-1ecf-4183-9955-b1499d5701d3",
        ListOptions::default(),
      )
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      // Get by contact id
      resend.contacts().topics().list("e169aa45-1ecf-4183-9955-b1499d5701d3");

      // Get by contact email
      resend.contacts().topics().list("steve.wozniak@gmail.com");
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.ContactListTopicsAsync( new Guid( "e169aa45-1ecf-4183-9955-b1499d5701d3" ));
  Console.WriteLine( "Nr Topics={0}", resp.Content.Data.Count );
  ```

  ```bash cURL theme={null}
  // Get by contact id
  curl -X GET 'https://api.resend.com/contacts/e169aa45-1ecf-4183-9955-b1499d5701d3/topics' \
       -H 'Authorization: Bearer re_xxxxxxxxx'

  // Get by contact email
  curl -X GET 'https://api.resend.com/contacts/steve.wozniak@gmail.com/topics' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "list",
    "has_more": false,
    "data": [
      {
        "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
        "name": "Product Updates",
        "description": "New features, and latest announcements.",
        "subscription": "opt_in"
      }
    ]
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Update Contact Topics

> Update topic subscriptions for a contact.

## Path Parameters

Either `id` or `email` must be provided.

<ParamField path="id" type="string">
  The Contact ID.
</ParamField>

<ParamField path="email" type="string">
  The Contact Email.
</ParamField>

## Body Parameters

<ParamField body="topics" type="array" required>
  Array of topic subscription updates.

  <Expandable defaultOpen="true" title="properties">
    <ParamField body="id" type="string" required>
      The Topic ID.
    </ParamField>

    <ParamField body="subscription" type="string" required>
      The subscription action. Must be either `opt_in` or `opt_out`.
    </ParamField>
  </Expandable>
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  // Update by contact id
  const { data, error } = await resend.contacts.topics.update({
    id: 'e169aa45-1ecf-4183-9955-b1499d5701d3',
    topics: [
      {
        id: 'b6d24b8e-af0b-4c3c-be0c-359bbd97381e',
        subscription: 'opt_out',
      },
      {
        id: '07d84122-7224-4881-9c31-1c048e204602',
        subscription: 'opt_in',
      },
    ],
  });

  // Update by contact email
  const { data, error } = await resend.contacts.topics.update({
    email: 'steve.wozniak@gmail.com',
    topics: [
      {
        id: '07d84122-7224-4881-9c31-1c048e204602',
        subscription: 'opt_out',
      },
      {
        id: '07d84122-7224-4881-9c31-1c048e204602',
        subscription: 'opt_in',
      },
    ],
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  // Update by contact id
  $resend->contacts->topics->update('e169aa45-1ecf-4183-9955-b1499d5701d3', [
    [
      'id' => '07d84122-7224-4881-9c31-1c048e204602',
      'subscription' => 'opt_out',
    ],
    [
      'id' => '07d84122-7224-4881-9c31-1c048e204602',
      'subscription' => 'opt_in',
    ],
  ]);

  // Update by contact email
  $resend->contacts->topics->update('steve.wozniak@gmail.com', [
    [
      'id' => '07d84122-7224-4881-9c31-1c048e204602',
      'subscription' => 'opt_out',
    ],
    [
      'id' => '07d84122-7224-4881-9c31-1c048e204602',
      'subscription' => 'opt_in',
    ],
  ]);
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  # Update by contact id
  params = {
      "id": "e169aa45-1ecf-4183-9955-b1499d5701d3",
      "topics": [
          {"id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e", "subscription": "opt_out"},
          {"id": "07d84122-7224-4881-9c31-1c048e204602", "subscription": "opt_in"},
      ],
  }

  response = resend.Contacts.Topics.update(params)

  # Update by contact email
  params_by_email = {
      "email": "steve.wozniak@gmail.com",
      "topics": [
          {"id": "07d84122-7224-4881-9c31-1c048e204602", "subscription": "opt_out"},
          {"id": "07d84122-7224-4881-9c31-1c048e204602", "subscription": "opt_in"},
      ],
  }

  response = resend.Contacts.Topics.update(params_by_email)
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  # Update by contact id
  update_params = {
    id: "e169aa45-1ecf-4183-9955-b1499d5701d3",
    topics: [
      { id: "b6d24b8e-af0b-4c3c-be0c-359bbd97381e", subscription: "opt_out" },
      { id: "07d84122-7224-4881-9c31-1c048e204602", subscription: "opt_in" }
    ]
  }
  updated_topics = Resend::Contacts::Topics.update(update_params)

  # Update by contact email
  update_params = {
    email: "steve.wozniak@gmail.com",
    topics: [
      { id: "07d84122-7224-4881-9c31-1c048e204602", subscription: "opt_out" },
      { id: "07d84122-7224-4881-9c31-1c048e204602", subscription: "opt_in" }
    ]
  }
  updated_topics = Resend::Contacts::Topics.update(update_params)
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	// Update by contact id
  	params := &resend.UpdateContactTopicsRequest{
  		ContactId: "e169aa45-1ecf-4183-9955-b1499d5701d3",
  		Topics: []resend.TopicSubscriptionUpdate{
  			{
  				Id:           "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
  				Subscription: "opt_out",
  			},
  			{
  				Id:           "07d84122-7224-4881-9c31-1c048e204602",
  				Subscription: "opt_in",
  			},
  		},
  	}

  	updatedTopics, err := client.Contacts.Topics.UpdateWithContext(ctx, params)
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(updatedTopics)

  	// Update by contact email
  	params = &resend.UpdateContactTopicsRequest{
  		Email: "steve.wozniak@gmail.com",
  		Topics: []resend.TopicSubscriptionUpdate{
  			{
  				Id:           "07d84122-7224-4881-9c31-1c048e204602",
  				Subscription: "opt_out",
  			},
  			{
  				Id:           "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
  				Subscription: "opt_in",
  			},
  		},
  	}

  	updatedTopics, err = client.Contacts.Topics.UpdateWithContext(ctx, params)
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(updatedTopics)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{
    types::{SubscriptionType, UpdateContactTopicOptions},
    Resend, Result,
  };

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let topics = [
      UpdateContactTopicOptions::new(
        "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
        SubscriptionType::OptOut,
      ),
      UpdateContactTopicOptions::new(
        "07d84122-7224-4881-9c31-1c048e204602",
        SubscriptionType::OptIn,
      ),
    ];

    let _contact = resend
      .contacts
      .update_contact_topics("e169aa45-1ecf-4183-9955-b1499d5701d3", topics)
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      // Update by contact id
      UpdateContactTopicsOptions optionsById = UpdateContactTopicsOptions.builder()
                  .id("e169aa45-1ecf-4183-9955-b1499d5701d3")
                  .topics(ContactTopicOptions.builder()
                              .id("b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
                              .subscription("opt_out")
                              .build(),
                          ContactTopicOptions.builder()
                              .id("07d84122-7224-4881-9c31-1c048e204602")
                              .subscription("opt_in")
                              .build())
                  .build();

      resend.contacts().topics().update(optionsById);

      // Update by contact email
      UpdateContactTopicsOptions optionsByEmail = UpdateContactTopicsOptions.builder()
                  .email("steve.wozniak@gmail.com")
                  .topics(ContactTopicOptions.builder()
                              .id("07d84122-7224-4881-9c31-1c048e204602")
                              .subscription("opt_in")
                              .build(),
                          ContactTopicOptions.builder()
                              .id("b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
                              .subscription("opt_out")
                              .build())
                  .build();

      resend.contacts().topics().update(optionsById);
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var topics = new List<TopicSubscription>();

  topics.Add( new TopicSubscription() {
    Id = new Guid( "07d84122-7224-4881-9c31-1c048e204602" ),
    Subscription = SubscriptionType.OptIn,
  });

  topics.Add( new TopicSubscription() {
    Id = new Guid( "b6d24b8e-af0b-4c3c-be0c-359bbd97381e" ),
    Subscription = SubscriptionType.OptOut,
  });

  await resend.ContactUpdateTopicsAsync(
      new Guid( "e169aa45-1ecf-4183-9955-b1499d5701d3" ),
      topics );
  ```

  ```bash cURL theme={null}
  // Update by contact id
  curl -X PATCH 'https://api.resend.com/contacts/e169aa45-1ecf-4183-9955-b1499d5701d3/topics' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'[
        {
          "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
          "subscription": "opt_out"
        }
       ]'

  // Update by contact email
  curl -X PATCH 'https://api.resend.com/contacts/steve.wozniak@gmail.com/topics' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'[
        {
          "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
          "subscription": "opt_out"
        }
       ]'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt
# Create Contact Property

> Create a custom property for your contacts.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Body Parameters

<ResendParamField body="key" type="string" required>
  The property key. Max length is `50` characters. Only alphanumeric characters
  and underscores are allowed.
</ResendParamField>

<ResendParamField body="type" type="string" required>
  The property type. Possible values: `string` or `number`.
</ResendParamField>

<ResendParamField body="fallback_value" type="string | number">
  The default value to use when the property is not set for a contact. Must
  match the type specified in the `type` field.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.contactProperties.create({
    key: 'company_name',
    type: 'string',
    fallbackValue: 'Acme Corp',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->contactProperties->create([
    'key' => 'company_name',
    'type' => 'string',
    'fallback_value' => 'Acme Corp',
  ]);
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  params = {
      "key": "company_name",
      "type": "string",
      "fallback_value": "Acme Corp",
  }

  contact_property = resend.ContactProperties.create(params)
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  property = Resend::ContactProperties.create({
    key: "company_name",
    type: "string",
    fallback_value: "Acme Corp"
  })
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	params := &resend.CreateContactPropertyRequest{
  		Key:           "company_name",
  		Type:          "string",
  		FallbackValue: "Acme Corp",
  	}

  	property, err := client.ContactProperties.CreateWithContext(ctx, params)
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(property)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{
    types::{CreateContactPropertyOptions, PropertyType},
    Resend, Result,
  };

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let contact_property = CreateContactPropertyOptions::new("company_name", PropertyType::String)
      .with_fallback("Acme Corp");

    let _contact_property = resend.contacts.create_property(contact_property).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      CreateContactPropertyOptions options = CreateContactPropertyOptions.builder()
        .key("company_name")
        .type("string")
        .fallbackValue("Acme Corp")
        .build();

      resend.contactProperties().create(options);
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.ContactPropCreateAsync( new ContactPropertyData() {
    Key = "company_name",
    PropertyType = ContactPropertyType.String,
    DefaultValue = "Acme Corp",
  } );
  Console.WriteLine( "Prop Id={0}", resp.Content );
  ```

  ```bash cURL theme={null}
  curl -X POST 'https://api.resend.com/contact-properties' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "key": "company_name",
    "type": "string",
    "fallback_value": "Acme Corp"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "contact_property",
    "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Retrieve Contact Property

> Retrieve a contact property by its ID.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

<ResendParamField path="contact_property_id" type="string" required>
  The Contact Property ID.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.contactProperties.get(
    'b6d24b8e-af0b-4c3c-be0c-359bbd97381e',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->contactProperties->get('b6d24b8e-af0b-4c3c-be0c-359bbd97381');
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  contact_property = resend.ContactProperties.get('b6d24b8e-af0b-4c3c-be0c-359bbd97381e')
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  property = Resend::ContactProperties.get("b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	property, err := client.ContactProperties.GetWithContext(ctx, "b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(property)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _property = resend
      .contacts
      .get_property("b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      resend.contactProperties().get("b6d24b8e-af0b-4c3c-be0c-359bbd97381e");
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.ContactPropRetrieveAsync( new Guid( "b6d24b8e-af0b-4c3c-be0c-359bbd97381e" ) );
  Console.WriteLine( "Prop Id={0}", resp.Content.Id );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/contact-properties/b6d24b8e-af0b-4c3c-be0c-359bbd97381e' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "contact_property",
    "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
    "key": "company_name",
    "type": "string",
    "fallback_value": "Acme Corp",
    "created_at": "2023-04-08T00:11:13.110779+00:00"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# List Contact Properties

> Retrieve a list of contact properties.

export const QueryParams = ({type, isRequired}) => {
  return <>
      <h2>Query Parameters</h2>

      {isRequired ? <ParamField query="limit" type="number">
          Number of {type} to retrieve.
          <ul>
            <li>
              Default value: <code>20</code>
            </li>
            <li>
              Maximum value: <code>100</code>
            </li>
            <li>
              Minimum value: <code>1</code>
            </li>
          </ul>
        </ParamField> : <>
          <p>
            Note that the <code>limit</code> parameter is <em>optional</em>. If
            you do not provide a <code>limit</code>, all {type} will be returned
            in a single response.
          </p>
          <ParamField query="limit" type="number">
            Number of {type} to retrieve.
            <ul>
              <li>
                Maximum value: <code>100</code>
              </li>
              <li>
                Minimum value: <code>1</code>
              </li>
            </ul>
          </ParamField>
        </>}

      <ParamField query="after" type="string">
        The ID <em>after</em> which we'll retrieve more {type} (for pagination).
        This ID will <em>not</em> be included in the returned list. Cannot be
        used with the
        <code>before</code> parameter.
      </ParamField>
      <ParamField query="before" type="string">
        The ID <em>before</em> which we'll retrieve more {type} (for
        pagination). This ID will <em>not</em> be included in the returned list.
        Cannot be used with the <code>after</code> parameter.
      </ParamField>
      <Info>
        You can only use either <code>after</code> or <code>before</code>{' '}
        parameter, not both. See our{' '}
        <a href="/api-reference/pagination">pagination guide</a> for more
        information.
      </Info>
    </>;
};

<QueryParams type="contact-properties" isRequired={true} />

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.contactProperties.list();
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->contactProperties->list();
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  contact_properties = resend.ContactProperties.list()
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  properties = Resend::ContactProperties.list
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	properties, err := client.ContactProperties.ListWithContext(ctx)
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(properties)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{list_opts::ListOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _contact_properties = resend
      .contacts
      .list_properties(ListOptions::default())
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      resend.contactProperties().list();
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.ContactPropListAsync();
  Console.WriteLine( "Nr Props={0}", resp.Content.Data.Count );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/contact-properties' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "list",
    "has_more": false,
    "data": [
      {
        "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
        "key": "company_name",
        "type": "string",
        "fallback_value": "Acme Corp",
        "created_at": "2023-04-08T00:11:13.110779+00:00"
      }
    ]
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Update Contact Property

> Update an existing contact property.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

<ResendParamField path="contact_property_id" type="string" required>
  The Contact Property ID.
</ResendParamField>

<Note>
  The `key` and `type` fields cannot be changed after creation. This preserves
  data integrity for existing contact values.
</Note>

## Body Parameters

<ResendParamField body="fallback_value" type="string | number">
  The default value to use when the property is not set for a contact. Must
  match the type of the property.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.contactProperties.update({
    id: 'b6d24b8e-af0b-4c3c-be0c-359bbd97381e',
    fallbackValue: 'Example Company',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->contactProperties->update('b6d24b8e-af0b-4c3c-be0c-359bbd97381', [
    'fallback_value' => 'Example Company',
  ]);
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  params = {
      "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
      "fallback_value": "Example Company",
  }

  contact_property = resend.ContactProperties.update(params)
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  property = Resend::ContactProperties.update({
    id: "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
    fallback_value: "Example Company"
  })
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	params := &resend.UpdateContactPropertyRequest{
  		Id:            "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
  		FallbackValue: "Example Company",
  	}

  	property, err := client.ContactProperties.UpdateWithContext(ctx, params)
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(property)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{types::ContactPropertyChanges, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let update = ContactPropertyChanges::default().with_fallback("Example Company");
    let _contact_property = resend
      .contacts
      .update_property("b6d24b8e-af0b-4c3c-be0c-359bbd97381e", update)
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      UpdateContactPropertyOptions options = UpdateContactPropertyOptions.builder()
        .id("b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
        .fallbackValue("Example Company")
        .build();

      resend.contactProperties().update(options);
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.ContactPropUpdateAsync(
    new Guid( "b6d24b8e-af0b-4c3c-be0c-359bbd97381e" ),
    new ContactPropertyUpdateData() {
      DefaultValue = "Example Company",
    }
  );
  ```

  ```bash cURL theme={null}
  curl -X PATCH 'https://api.resend.com/contact-properties/b6d24b8e-af0b-4c3c-be0c-359bbd97381e' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "fallback_value": "Example Company"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "contact_property",
    "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Delete Contact Property

> Remove an existing contact property.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

<ResendParamField path="contact_property_id" type="string" required>
  The Contact Property ID.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.contactProperties.remove(
    'b6d24b8e-af0b-4c3c-be0c-359bbd97381e',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->contactProperties->remove('b6d24b8e-af0b-4c3c-be0c-359bbd97381');
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  contact_property = resend.ContactProperties.remove('b6d24b8e-af0b-4c3c-be0c-359bbd97381e')
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::ContactProperties.remove("b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	property, err := client.ContactProperties.RemoveWithContext(ctx, "b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(property)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _deleted = resend
      .contacts
      .delete_property("b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      resend.contactProperties().remove("b6d24b8e-af0b-4c3c-be0c-359bbd97381e");
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.ContactPropDeleteAsync( new Guid( "b6d24b8e-af0b-4c3c-be0c-359bbd97381e" ) );
  ```

  ```bash cURL theme={null}
  curl -X DELETE 'https://api.resend.com/contact-properties/b6d24b8e-af0b-4c3c-be0c-359bbd97381e' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "contact_property",
    "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
    "deleted": true
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Create Segment

> Create a new segment for contacts to be added to.

## Body Parameters

<ParamField body="name" type="string" required>
  The name of the segment you want to create.
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.segments.create({
    name: 'Registered Users',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->segments->create([
    'name' => 'Registered Users',
  ]);
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  params = {
      "name": "Registered Users",
  }

  segment = resend.Segments.create(params)
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  params = {
    name: "Registered Users",
  }
  segment = Resend::Segments.create(params)
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	params := &resend.CreateSegmentRequest{
  		Name: "Registered Users",
  	}

  	segment, err := client.Segments.CreateWithContext(ctx, params)
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(segment)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _segment = resend.segments.create("Registered Users").await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          CreateSegmentOptions options = CreateSegmentOptions.builder()
              .name("Registered Users")
              .build();

          CreateSegmentResponseSuccess response = resend.segments().create(options);
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.SegmentCreateAsync( new SegmentData() {
    Name = "Registered Users",
  } );
  Console.WriteLine( "Segment Id={0}", resp.Content );
  ```

  ```bash cURL theme={null}
  curl -X POST 'https://api.resend.com/segments' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "name": "Registered Users"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "segment",
    "id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
    "name": "Registered Users"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Retrieve Segment

> Retrieve a single segment.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

<ResendParamField path="segment_id" type="string" required>
  The Segment ID.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.segments.get(
    '78261eea-8f8b-4381-83c6-79fa7120f1cf',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->segments->get('78261eea-8f8b-4381-83c6-79fa7120f1cf');
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  segment = resend.Segments.get('78261eea-8f8b-4381-83c6-79fa7120f1cf')
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  segment = Resend::Segments.get("78261eea-8f8b-4381-83c6-79fa7120f1cf")
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	segment, err := client.Segments.GetWithContext(ctx, "78261eea-8f8b-4381-83c6-79fa7120f1cf")
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(segment)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _segment = resend
      .segments
      .get("78261eea-8f8b-4381-83c6-79fa7120f1cf")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          GetSegmentResponseSuccess response = resend.segments().get("78261eea-8f8b-4381-83c6-79fa7120f1cf");
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.SegmentRetrieveAsync( new Guid( "b6d24b8e-af0b-4c3c-be0c-359bbd97381e" ) );
  Console.WriteLine( "Segment Id={0}", resp.Content.Id );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/segments/78261eea-8f8b-4381-83c6-79fa7120f1cf' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "segment",
    "id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
    "name": "Registered Users",
    "created_at": "2023-10-06T22:59:55.977Z"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# List Segments

> Retrieve a list of segments.

export const QueryParams = ({type, isRequired}) => {
  return <>
      <h2>Query Parameters</h2>

      {isRequired ? <ParamField query="limit" type="number">
          Number of {type} to retrieve.
          <ul>
            <li>
              Default value: <code>20</code>
            </li>
            <li>
              Maximum value: <code>100</code>
            </li>
            <li>
              Minimum value: <code>1</code>
            </li>
          </ul>
        </ParamField> : <>
          <p>
            Note that the <code>limit</code> parameter is <em>optional</em>. If
            you do not provide a <code>limit</code>, all {type} will be returned
            in a single response.
          </p>
          <ParamField query="limit" type="number">
            Number of {type} to retrieve.
            <ul>
              <li>
                Maximum value: <code>100</code>
              </li>
              <li>
                Minimum value: <code>1</code>
              </li>
            </ul>
          </ParamField>
        </>}

      <ParamField query="after" type="string">
        The ID <em>after</em> which we'll retrieve more {type} (for pagination).
        This ID will <em>not</em> be included in the returned list. Cannot be
        used with the
        <code>before</code> parameter.
      </ParamField>
      <ParamField query="before" type="string">
        The ID <em>before</em> which we'll retrieve more {type} (for
        pagination). This ID will <em>not</em> be included in the returned list.
        Cannot be used with the <code>after</code> parameter.
      </ParamField>
      <Info>
        You can only use either <code>after</code> or <code>before</code>{' '}
        parameter, not both. See our{' '}
        <a href="/api-reference/pagination">pagination guide</a> for more
        information.
      </Info>
    </>;
};

<QueryParams type="segments" isRequired={false} />

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.segments.list();
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->segments->list();
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  segments = resend.Segments.list()
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  segments = Resend::Segments.list
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	segments, err := client.Segments.ListWithContext(ctx)
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(segments)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{list_opts::ListOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _segments = resend.segments.list(ListOptions::default()).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          ListSegmentsResponseSuccess response = resend.segments().list();
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.SegmentListAsync();
  Console.WriteLine( "Nr Segments={0}", resp.Content.Data.Count );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/segments' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "list",
    "has_more": false,
    "data": [
      {
        "id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
        "name": "Registered Users",
        "created_at": "2023-10-06T22:59:55.977Z"
      }
    ]
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Delete Segment

> Remove an existing segment.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

<ResendParamField path="segment_id" type="string" required>
  The Segment ID.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.segments.remove(
    '78261eea-8f8b-4381-83c6-79fa7120f1cf',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->segments->remove('78261eea-8f8b-4381-83c6-79fa7120f1cf');
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = 're_xxxxxxxxx'

  segment = resend.Segments.remove(id='78261eea-8f8b-4381-83c6-79fa7120f1cf')
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Segments.remove("78261eea-8f8b-4381-83c6-79fa7120f1cf")
  ```

  ```go Go theme={null}
  package main

  import (
  	"context"
  	"fmt"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	ctx := context.TODO()
  	apiKey := "re_xxxxxxxxx"

  	client := resend.NewClient(apiKey)

  	segment, err := client.Segments.RemoveWithContext(ctx, "78261eea-8f8b-4381-83c6-79fa7120f1cf")
  	if err != nil {
  		panic(err)
  	}
  	fmt.Println(segment)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _segment = resend
      .segments
      .delete("78261eea-8f8b-4381-83c6-79fa7120f1cf")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          RemoveSegmentResponseSuccess response = resend.segments().remove("78261eea-8f8b-4381-83c6-79fa7120f1cf");
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.SegmentDeleteAsync( new Guid( "b6d24b8e-af0b-4c3c-be0c-359bbd97381e" ) );
  ```

  ```bash cURL theme={null}
  curl -X DELETE 'https://api.resend.com/segments/78261eea-8f8b-4381-83c6-79fa7120f1cf' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "segment",
    "id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
    "deleted": true
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Create Audience

> Create a list of contacts.

<Danger>
  Audiences are deprecated in favor of Segments.

  <span />

  These endpoints still work, but will be removed in the future.

  <ul>
    <li>
      Go to the [Create Segment](/api-reference/segments/create-segment) page
    </li>

    <li>
      Follow the [Migration
      Guide](/dashboard/segments/migrating-from-audiences-to-segments)
    </li>
  </ul>

  Or [contact support](https://resend.com/contact) if you have any questions.
</Danger>

## Body Parameters

<ParamField body="name" type="string" required>
  The name of the audience you want to create.
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.audiences.create({
    name: 'Registered Users',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->audiences->create([
    'name' => 'Registered Users'
  ]);
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  params: resend.Audiences.CreateParams = {
    "name": "Registered Users"
  }

  resend.Audiences.create(params)
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Audiences.create({ name: "Registered Users" })
  ```

  ```go Go theme={null}
  import 	"github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  params := &resend.CreateAudienceRequest{
    Name: "Registered Users",
  }

  audience, err := client.Audiences.Create(params)
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _audience = resend.audiences.create("Registered Users").await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          CreateAudienceOptions params = CreateAudienceOptions
                  .builder()
                  .name("Registered Users").build();

          CreateAudienceResponseSuccess data = resend.audiences().create(params);
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.AudienceAddAsync( "Registered Users" );
  Console.WriteLine( "AudienceId={0}", resp.Content );
  ```

  ```bash cURL theme={null}
  curl -X POST 'https://api.resend.com/audiences' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "name": "Registered Users"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "audience",
    "id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
    "name": "Registered Users"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Retrieve Audience

> Retrieve a single audience.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

<Danger>
  Audiences are deprecated in favor of Segments.

  <span />

  These endpoints still work, but will be removed in the future.

  <ul>
    <li>
      Go to the [Retrieve Segment](/api-reference/segments/get-segment) page
    </li>

    <li>
      Follow the [Migration
      Guide](/dashboard/segments/migrating-from-audiences-to-segments)
    </li>
  </ul>

  Or [contact support](https://resend.com/contact) if you have any questions.
</Danger>

## Path Parameters

<ResendParamField path="audience_id" type="string" required>
  The Audience ID.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.audiences.get(
    '78261eea-8f8b-4381-83c6-79fa7120f1cf',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->audiences->get('78261eea-8f8b-4381-83c6-79fa7120f1cf');
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Audiences.get("78261eea-8f8b-4381-83c6-79fa7120f1cf")
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Audiences.get("78261eea-8f8b-4381-83c6-79fa7120f1cf")
  ```

  ```go Go theme={null}
  import 	"github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  audience, err := client.Audiences.Get("78261eea-8f8b-4381-83c6-79fa7120f1cf")
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _audience = resend
      .audiences
      .get("78261eea-8f8b-4381-83c6-79fa7120f1cf")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          GetAudienceResponseSuccess data = resend.audiences().get("78261eea-8f8b-4381-83c6-79fa7120f1cf");
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.AudienceRetrieveAsync( new Guid( "78261eea-8f8b-4381-83c6-79fa7120f1cf" ) );
  Console.WriteLine( "Name={0}", resp.Content.Name );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/audiences/78261eea-8f8b-4381-83c6-79fa7120f1cf' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "audience",
    "id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
    "name": "Registered Users",
    "created_at": "2023-10-06T22:59:55.977Z"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# List Audiences

> Retrieve a list of audiences.

export const QueryParams = ({type, isRequired}) => {
  return <>
      <h2>Query Parameters</h2>

      {isRequired ? <ParamField query="limit" type="number">
          Number of {type} to retrieve.
          <ul>
            <li>
              Default value: <code>20</code>
            </li>
            <li>
              Maximum value: <code>100</code>
            </li>
            <li>
              Minimum value: <code>1</code>
            </li>
          </ul>
        </ParamField> : <>
          <p>
            Note that the <code>limit</code> parameter is <em>optional</em>. If
            you do not provide a <code>limit</code>, all {type} will be returned
            in a single response.
          </p>
          <ParamField query="limit" type="number">
            Number of {type} to retrieve.
            <ul>
              <li>
                Maximum value: <code>100</code>
              </li>
              <li>
                Minimum value: <code>1</code>
              </li>
            </ul>
          </ParamField>
        </>}

      <ParamField query="after" type="string">
        The ID <em>after</em> which we'll retrieve more {type} (for pagination).
        This ID will <em>not</em> be included in the returned list. Cannot be
        used with the
        <code>before</code> parameter.
      </ParamField>
      <ParamField query="before" type="string">
        The ID <em>before</em> which we'll retrieve more {type} (for
        pagination). This ID will <em>not</em> be included in the returned list.
        Cannot be used with the <code>after</code> parameter.
      </ParamField>
      <Info>
        You can only use either <code>after</code> or <code>before</code>{' '}
        parameter, not both. See our{' '}
        <a href="/api-reference/pagination">pagination guide</a> for more
        information.
      </Info>
    </>;
};

<Danger>
  Audiences are deprecated in favor of Segments.

  <span />

  These endpoints still work, but will be removed in the future.

  <ul>
    <li>
      Go to the [List Segments](/api-reference/segments/list-segments) page
    </li>

    <li>
      Follow the [Migration
      Guide](/dashboard/segments/migrating-from-audiences-to-segments)
    </li>
  </ul>

  Or [contact support](https://resend.com/contact) if you have any questions.
</Danger>

<QueryParams type="audiences" isRequired={false} />

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.audiences.list();
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->audiences->list();
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Audiences.list()
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Audiences.list
  ```

  ```go Go theme={null}
  import 	"github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  audiences, err := client.Audiences.List()
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result, list_opts::ListOptions};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _audiences = resend.audiences.list(ListOptions::default()).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          ListAudiencesResponseSuccess data = resend.audiences().list();
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.AudienceListAsync();
  Console.WriteLine( "Nr Audience={0}", resp.Content.Count );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/audiences' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "list",
    "has_more": false,
    "data": [
      {
        "id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
        "name": "Registered Users",
        "created_at": "2023-10-06T22:59:55.977Z"
      }
    ]
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Delete Audience

> Remove an existing audience.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

<Danger>
  Audiences are deprecated in favor of Segments.

  <span />

  These endpoints still work, but will be removed in the future.

  <ul>
    <li>
      Go to the [Delete Segment](/api-reference/segments/delete-segment) page
    </li>

    <li>
      Follow the [Migration
      Guide](/dashboard/segments/migrating-from-audiences-to-segments)
    </li>
  </ul>

  Or [contact support](https://resend.com/contact) if you have any questions.
</Danger>

## Path Parameters

<ResendParamField path="audience_id" type="string" required>
  The Audience ID.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.audiences.remove(
    '78261eea-8f8b-4381-83c6-79fa7120f1cf',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->audiences->remove('78261eea-8f8b-4381-83c6-79fa7120f1cf');
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Audiences.remove("78261eea-8f8b-4381-83c6-79fa7120f1cf")
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Audiences.remove("78261eea-8f8b-4381-83c6-79fa7120f1cf")
  ```

  ```go Go theme={null}
  import 	"github.com/resend/resend-go/v3"

  client := resend.NewClient("re_xxxxxxxxx")

  removed, err := client.Audiences.Remove("78261eea-8f8b-4381-83c6-79fa7120f1cf")
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _deleted = resend
      .audiences
      .delete("78261eea-8f8b-4381-83c6-79fa7120f1cf")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          RemoveAudienceResponseSuccess data = resend.audiences().remove("78261eea-8f8b-4381-83c6-79fa7120f1cf");
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  await resend.AudienceDeleteAsync( new Guid( "78261eea-8f8b-4381-83c6-79fa7120f1cf" ) );
  ```

  ```bash cURL theme={null}
  curl -X DELETE 'https://api.resend.com/audiences/78261eea-8f8b-4381-83c6-79fa7120f1cf' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "audience",
    "id": "78261eea-8f8b-4381-83c6-79fa7120f1cf",
    "deleted": true
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Create Topic

> Create and email topics to segment your audience.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Body Parameters

<ParamField body="name" type="string" required>
  The topic name. Max length is `50` characters.
</ParamField>

<ResendParamField body="default_subscription" type="string" required>
  The default subscription preference for new contacts. Possible values:
  `opt_in` or `opt_out`.

  <Note>
    This value cannot be changed later.
  </Note>
</ResendParamField>

<ParamField body="description" type="string">
  The topic description. Max length is `200` characters.
</ParamField>

<ResendParamField body="visibility" type="string">
  The visibility of the topic on the unsubscribe page. Possible values: `public` or `private`.

  * `private`: only contacts who are opted in to the topic can see it on the unsubscribe page.
  * `public`: all contacts can see the topic on the unsubscribe page.

  If not specified, defaults to `private`.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.topics.create({
    name: 'Weekly Newsletter',
    defaultSubscription: 'opt_in',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->topics->create([
    'name' => 'Weekly Newsletter',
    'default_subscription' => 'opt_in',
  ]);
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Topics.create({
      "name": "Weekly Newsletter",
      "default_subscription": "opt_in",
      "description": "Subscribe to our weekly newsletter for updates",
  })
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Topics.create(
    name: "Weekly Newsletter",
    default_subscription: "opt_in"
  )
  ```

  ```go Go theme={null}
  import (
  	"context"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	topic, err := client.Topics.CreateWithContext(context.TODO(), &resend.CreateTopicRequest{
  		Name:                "Weekly Newsletter",
  		DefaultSubscription: resend.DefaultSubscriptionOptIn,
  	})
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{
    types::{CreateTopicOptions, SubscriptionType},
    Resend, Result,
  };

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let opts = CreateTopicOptions::new("Weekly Newsletter", SubscriptionType::OptIn);
    let _topic = resend.topics.create(opts).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      CreateTopicOptions createTopicOptions = CreateTopicOptions.builder()
        .name("Weekly Newsletter")
        .defaultSubscription("opt_in")
        .build();

      CreateTopicResponseSuccess response = resend.topics().create(createTopicOptions);
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.TopicCreateAsync( new TopicData() {
    Name = "Weekly Newsletter",
    Description = "Weekly newsletter for our subscribers",
    SubscriptionDefault = SubscriptionType.OptIn,
  } );
  Console.WriteLine( "Topic Id={0}", resp.Content );
  ```

  ```bash cURL theme={null}
  curl -X POST 'https://api.resend.com/topics' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "name": "Weekly Newsletter",
    "default_subscription": "opt_in"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "topic",
    "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Retrieve Topic

> Retrieve a topic by its ID.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

<ResendParamField path="topic_id" type="string" required>
  The Topic ID.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.topics.get(
    'b6d24b8e-af0b-4c3c-be0c-359bbd97381e',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->topics->get('b6d24b8e-af0b-4c3c-be0c-359bbd97381e');
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Topics.get("b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Topics.get("b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
  ```

  ```go Go theme={null}
  import (
  	"context"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	topic, err := client.Topics.GetWithContext(
  		context.TODO(),
  		"b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
  	)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _topic = resend
      .topics
      .get("b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      GetTopicResponseSuccess topic = resend.topics().get("b6d24b8e-af0b-4c3c-be0c-359bbd97381e");
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.TopicRetrieveAsync( new Guid( "b6d24b8e-af0b-4c3c-be0c-359bbd97381e" ) );
  Console.WriteLine( "Topic Id={0}", resp.Content.Id );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/topics/b6d24b8e-af0b-4c3c-be0c-359bbd97381e' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "topic",
    "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
    "name": "Weekly Newsletter",
    "description": "Weekly newsletter for our subscribers",
    "default_subscription": "opt_in",
    "visibility": "public",
    "created_at": "2023-04-08T00:11:13.110779+00:00"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# List Topics

> Retrieve a list of topics for the authenticated user.

export const QueryParams = ({type, isRequired}) => {
  return <>
      <h2>Query Parameters</h2>

      {isRequired ? <ParamField query="limit" type="number">
          Number of {type} to retrieve.
          <ul>
            <li>
              Default value: <code>20</code>
            </li>
            <li>
              Maximum value: <code>100</code>
            </li>
            <li>
              Minimum value: <code>1</code>
            </li>
          </ul>
        </ParamField> : <>
          <p>
            Note that the <code>limit</code> parameter is <em>optional</em>. If
            you do not provide a <code>limit</code>, all {type} will be returned
            in a single response.
          </p>
          <ParamField query="limit" type="number">
            Number of {type} to retrieve.
            <ul>
              <li>
                Maximum value: <code>100</code>
              </li>
              <li>
                Minimum value: <code>1</code>
              </li>
            </ul>
          </ParamField>
        </>}

      <ParamField query="after" type="string">
        The ID <em>after</em> which we'll retrieve more {type} (for pagination).
        This ID will <em>not</em> be included in the returned list. Cannot be
        used with the
        <code>before</code> parameter.
      </ParamField>
      <ParamField query="before" type="string">
        The ID <em>before</em> which we'll retrieve more {type} (for
        pagination). This ID will <em>not</em> be included in the returned list.
        Cannot be used with the <code>after</code> parameter.
      </ParamField>
      <Info>
        You can only use either <code>after</code> or <code>before</code>{' '}
        parameter, not both. See our{' '}
        <a href="/api-reference/pagination">pagination guide</a> for more
        information.
      </Info>
    </>;
};

<QueryParams type="topics" isRequired={true} />

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.topics.list();
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->topics->list();
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Topics.list()
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Topics.list()
  ```

  ```go Go theme={null}
  import (
  	"context"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	topics, err := client.Topics.ListWithContext(context.TODO(), nil)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{list_opts::ListOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _list = resend.topics.list(ListOptions::default()).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      ListTopicsResponseSuccess response = resend.topics().list();
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.TopicListAsync();
  Console.WriteLine( "Nr Topics={0}", resp.Content.Data.Count );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/topics' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "list",
    "has_more": false,
    "data": [
      {
        "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
        "name": "Weekly Newsletter",
        "description": "Weekly newsletter for our subscribers",
        "default_subscription": "opt_in",
        "visibility": "public",
        "created_at": "2023-04-08T00:11:13.110779+00:00"
      }
    ]
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Update Topic

> Update an existing topic.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

<ResendParamField path="topic_id" type="string" required>
  The Topic ID.
</ResendParamField>

## Body Parameters

<ParamField body="name" type="string">
  The topic name. Max length is `50` characters.
</ParamField>

<ParamField body="description" type="string">
  The topic description. Max length is `200` characters.
</ParamField>

<ResendParamField body="visibility" type="string">
  The visibility of the topic on the unsubscribe page. Possible values: `public` or `private`.

  * `private`: only contacts who are opted in to the topic can see it on the unsubscribe page.
  * `public`: all contacts can see the topic on the unsubscribe page.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.topics.update(
    'b6d24b8e-af0b-4c3c-be0c-359bbd97381e',
    {
      name: 'Weekly Newsletter',
      description: 'Weekly newsletter for our subscribers',
    },
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->topics->update('b6d24b8e-af0b-4c3c-be0c-359bbd97381e', [
    'name' => 'Weekly Newsletter',
    'description' => 'Weekly newsletter for our subscribers',
  ]);
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Topics.update(
      id="b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
      params={
          "name": "Monthly Newsletter",
          "description": "Subscribe to our monthly newsletter for updates",
      }
  )
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Topics.update(
    topic_id: "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
    name: "Weekly Newsletter",
    description: "Weekly newsletter for our subscribers"
  )
  ```

  ```go Go theme={null}
  import (
  	"context"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	topic, err := client.Topics.UpdateWithContext(context.TODO(), "b6d24b8e-af0b-4c3c-be0c-359bbd97381e", &resend.UpdateTopicRequest{
  		Name:        "Weekly Newsletter",
  		Description: "Weekly newsletter for our subscribers",
  	})
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{types::UpdateTopicOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let update = UpdateTopicOptions::new()
      .with_name("Weekly Newsletter")
      .with_description("Weekly newsletter for our subscribers");

    let _topic = resend
      .topics
      .update("b6d24b8e-af0b-4c3c-be0c-359bbd97381e", update)
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      UpdateTopicOptions updateTopicOptions = UpdateTopicOptions.builder()
        .name("Weekly Newsletter")
        .description("Weekly newsletter for our subscribers")
        .build();

      UpdateTopicResponseSuccess response = resend.topics().update(
        "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
        updateTopicOptions
      );
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.TopicUpdateAsync(
    new Guid( "b6d24b8e-af0b-4c3c-be0c-359bbd97381e" ),
    new TopicData() {
      Name = "Weekly Newsletter",
      Description = "Weekly newsletter for our subscribers",
      SubscriptionDefault = SubscriptionType.OptIn,
    }
  );
  ```

  ```bash cURL theme={null}
  curl -X PATCH 'https://api.resend.com/topics/b6d24b8e-af0b-4c3c-be0c-359bbd97381e' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "name": "Weekly Newsletter",
    "default_subscription": "opt_in"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "topic",
    "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Delete Topic

> Remove an existing topic.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

<ResendParamField path="topic_id" type="string" required>
  The topic ID.
</ResendParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.topics.remove(
    'b6d24b8e-af0b-4c3c-be0c-359bbd97381e',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->topics->remove('b6d24b8e-af0b-4c3c-be0c-359bbd97381e');
  ```

  ```python Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Topics.remove(id="b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Topics.remove("b6d24b8e-af0b-4c3c-be0c-359bbd97381e")
  ```

  ```go Go theme={null}
  import (
  	"context"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	topic, err := client.Topics.RemoveWithContext(
  		context.TODO(),
  		"b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
  	)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _deleted = resend.topics.delete("delete").await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
    public static void main(String[] args) {
      Resend resend = new Resend("re_xxxxxxxxx");

      RemoveTopicResponseSuccess response = resend.topics().remove("b6d24b8e-af0b-4c3c-be0c-359bbd97381e");
    }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.TopicDeleteAsync( new Guid( "b6d24b8e-af0b-4c3c-be0c-359bbd97381e" ) );
  ```

  ```bash cURL theme={null}
  curl -X DELETE 'https://api.resend.com/topics/b6d24b8e-af0b-4c3c-be0c-359bbd97381e' \
       -H 'Authorization: Bearer re_xxxxxxxxx'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "topic",
    "id": "b6d24b8e-af0b-4c3c-be0c-359bbd97381e",
    "deleted": true
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Create Template

> Create a new template with optional variables.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Body Parameters

<ParamField body="name" type="string" required>
  The name of the template.
</ParamField>

<ParamField body="html" type="string" required>
  The HTML version of the template.
</ParamField>

<ParamField body="alias" type="string">
  The alias of the template.
</ParamField>

<ParamField body="from" type="string">
  Sender email address.

  To include a friendly name, use the format `"Your Name <sender@domain.com>"`.

  If provided, this value can be overridden when sending an email using the template.
</ParamField>

<ParamField body="subject" type="string">
  Default email subject.

  This value can be overridden when sending an email using the template.
</ParamField>

<ResendParamField body="reply_to" type="string | string[]">
  Default Reply-to email address. For multiple addresses, send as an array of strings.

  This value can be overridden when sending an email using the template.
</ResendParamField>

<ParamField body="text" type="string">
  The plain text version of the message.

  <Info>
    If not provided, the HTML will be used to generate a plain text version. You can opt out of this behavior by setting value to an empty string.
  </Info>
</ParamField>

<ParamField body="react" type="React.ReactNode">
  The React component used to write the template. *Only available in the Node.js
  SDK.*
</ParamField>

<ParamField body="variables" type="array">
  The array of variables used in the template. Each template may contain up to 20 variables.

  Each variable is an object with the following properties:

  <Expandable defaultOpen="true" title="properties">
    <ParamField body="key" type="string" required>
      The key of the variable. We recommend capitalizing the key (e.g. `PRODUCT_NAME`). The following variable names are reserved and cannot be used:
      `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `RESEND_UNSUBSCRIBE_URL`, `contact`, and `this`.
    </ParamField>

    <ParamField body="type" type="'string' | 'number'" required>
      The type of the variable.

      Can be `'string'` or `'number'`
    </ParamField>

    <ResendParamField body="fallback_value">
      The fallback value of the variable. The value must match the type of the variable.

      If no fallback value is provided, you must provide a value for the variable when sending an email using the template.
    </ResendParamField>
  </Expandable>

  <Info>
    Before you can use a template, you must publish it first. To publish a
    template, use the [Templates dashboard](https://resend.com/templates) or
    [publish template API](/api-reference/templates/publish-template).

    [Learn more about Templates](/dashboard/templates/introduction).
  </Info>
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.templates.create({
    name: 'order-confirmation',
    html: '<p>Name: {{{PRODUCT}}}</p><p>Total: {{{PRICE}}}</p>',
    variables: [
      {
        key: 'PRODUCT',
        type: 'string',
        fallbackValue: 'item',
      },
      {
        key: 'PRICE',
        type: 'number',
        fallbackValue: 25,
      }
    ],
  });

  // Or create and publish a template in one step
  await resend.templates.create({ ... }).publish();
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->templates->create([
    'name' => 'order-confirmation',
    'html' => '<p>Name: {{{PRODUCT}}}</p><p>Total: {{{PRICE}}}</p>',
    'variables' => [
      [
        'key' => 'PRODUCT',
        'type' => 'string',
        'fallback_value' => 'item',
      ],
      [
        'key' => 'PRICE',
        'type' => 'number',
        'fallback_value' => 25,
      ]
    ],
  ]);
  ```

  ```py Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Templates.create({
      "name": "order-confirmation",
      "html": "<p>Name: {{{PRODUCT}}}</p><p>Total: {{{PRICE}}}</p>",
      "variables": [
          {
              "key": "PRODUCT",
              "type": "string",
              "fallback_value": "item",
          },
          {
              "key": "PRICE",
              "type": "number",
              "fallback_value": 25,
          }
      ],
  })
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Templates.create(
    name: "order-confirmation",
    html: "<p>Name: {{{PRODUCT}}}</p><p>Total: {{{PRICE}}}</p>",
    variables: [
      {
        key: "PRODUCT",
        type: "string",
        fallback_value: "item"
      },
      {
        key: "PRICE",
        type: "number",
        fallback_value: 25
      }
    ]
  )
  ```

  ```go Go theme={null}
  import (
  	"context"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	template, err := client.Templates.CreateWithContext(context.TODO(), &resend.CreateTemplateRequest{
  		Name: "order-confirmation",
  		Html: "<p>Name: {{{PRODUCT}}}</p><p>Total: {{{PRICE}}}</p>",
  		Variables: []*resend.TemplateVariable{
  			{
  				Key:           "PRODUCT",
  				Type:          resend.VariableTypeString,
  				FallbackValue: "item",
  			},
  			{
  				Key:           "PRICE",
  				Type:          resend.VariableTypeNumber,
  				FallbackValue: 25,
  			}
  		},
  	})
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{
    types::{CreateTemplateOptions, Variable, VariableType},
    Resend, Result,
  };

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let name = "order-confirmation";
    let html = "<p>Name: {{{PRODUCT}}}</p><p>Total: {{{PRICE}}}</p>";

    let variables = [
      Variable::new("PRODUCT", VariableType::String).with_fallback("item"),
      Variable::new("PRICE", VariableType::Number).with_fallback(25)
    ];

    let opts = CreateTemplateOptions::new(name, html).with_variables(&variables);
    let template = resend.templates.create(opts).await?;

    let _published = resend.templates.publish(&template.id).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          CreateTemplateOptions params = CreateTemplateOptions.builder()
                  .name("order-confirmation")
                  .html("<p>Name: {{{PRODUCT}}}</p><p>Total: {{{PRICE}}}</p>")
                  .addVariable(new Variable("PRODUCT", VariableType.STRING, "item"))
                  .addVariable(new Variable("PRICE", VariableType.NUMBER, 25))
                  .build();

          CreateTemplateResponseSuccess data = resend.templates().create(params);
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create("re_xxxxxxxxx");

  var variables = new List<TemplateVariable>()
  {
    new TemplateVariable() {
      Key = "PRODUCT",
      Type = TemplateVariableType.String,
      Default = "item",
    },
    new TemplateVariable() {
      Key = "PRICE",
      Type = TemplateVariableType.Number,
      Default = 25,
    }
  };

  var resp = await resend.TemplateCreateAsync(
    new TemplateData()
    {
      Name = "welcome-email",
      HtmlBody = "<strong>Hey, {{{PRODUCT}}}, you are {{{PRICE}}} years old.</strong>",
      Variables = variables,
    }
  );

  Console.WriteLine($"Template Id={resp.Content}");
  ```

  ```bash cURL theme={null}
  curl -X POST 'https://api.resend.com/templates' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "name": "order-confirmation",
    "html": "<p>Name: {{{PRODUCT}}}</p><p>Total: {{{PRICE}}}</p>",
    "variables": [
      {
        "key": "PRODUCT",
        "type": "string",
        "fallback_value": "item"
      },
      {
        "key": "PRICE",
        "type": "number",
        "fallback_value": 25
      }
    ]
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
    "object": "template"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Get Template

> Get a template by ID.

## Path Parameters

<ParamField body="id | alias" type="string">
  The ID or alias of the template to get.
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.templates.get(
    '34a080c9-b17d-4187-ad80-5af20266e535',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->templates->get('34a080c9-b17d-4187-ad80-5af20266e535');
  ```

  ```py Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Templates.get("34a080c9-b17d-4187-ad80-5af20266e535")
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Templates.get("34a080c9-b17d-4187-ad80-5af20266e535")
  ```

  ```go Go theme={null}
  import (
  	"context"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	template, err := client.Templates.GetWithContext(
  		context.TODO(),
  		"34a080c9-b17d-4187-ad80-5af20266e535",
  	)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _template = resend
      .templates
      .get("34a080c9-b17d-4187-ad80-5af20266e535")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          GetTemplateResponseSuccess data = resend.templates().get("34a080c9-b17d-4187-ad80-5af20266e535");
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var res = await resend.TemplateRetrieveAsync( new Guid( "34a080c9-b17d-4187-ad80-5af20266e535" ) );
  Console.WriteLine( "Template Name={0}", res.Content.Name );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/templates/34a080c9-b17d-4187-ad80-5af20266e535' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "template",
    "id": "34a080c9-b17d-4187-ad80-5af20266e535",
    "current_version_id": "b2693018-7abb-4b4b-b4cb-aadf72dc06bd",
    "alias": "reset-password",
    "name": "reset-password",
    "created_at": "2023-10-06T23:47:56.678Z",
    "updated_at": "2023-10-06T23:47:56.678Z",
    "status": "published",
    "published_at": "2023-10-06T23:47:56.678Z",
    "from": "John Doe <john.doe@example.com>",
    "subject": "Hello, world!",
    "reply_to": null,
    "html": "<h1>Hello, world!</h1>",
    "text": "Hello, world!",
    "variables": [
      {
        "id": "e169aa45-1ecf-4183-9955-b1499d5701d3",
        "key": "user_name",
        "type": "string",
        "fallback_value": "John Doe",
        "created_at": "2023-10-06T23:47:56.678Z",
        "updated_at": "2023-10-06T23:47:56.678Z"
      }
    ],
    "has_unpublished_versions": true
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# List Templates

> List all templates.

export const QueryParams = ({type, isRequired}) => {
  return <>
      <h2>Query Parameters</h2>

      {isRequired ? <ParamField query="limit" type="number">
          Number of {type} to retrieve.
          <ul>
            <li>
              Default value: <code>20</code>
            </li>
            <li>
              Maximum value: <code>100</code>
            </li>
            <li>
              Minimum value: <code>1</code>
            </li>
          </ul>
        </ParamField> : <>
          <p>
            Note that the <code>limit</code> parameter is <em>optional</em>. If
            you do not provide a <code>limit</code>, all {type} will be returned
            in a single response.
          </p>
          <ParamField query="limit" type="number">
            Number of {type} to retrieve.
            <ul>
              <li>
                Maximum value: <code>100</code>
              </li>
              <li>
                Minimum value: <code>1</code>
              </li>
            </ul>
          </ParamField>
        </>}

      <ParamField query="after" type="string">
        The ID <em>after</em> which we'll retrieve more {type} (for pagination).
        This ID will <em>not</em> be included in the returned list. Cannot be
        used with the
        <code>before</code> parameter.
      </ParamField>
      <ParamField query="before" type="string">
        The ID <em>before</em> which we'll retrieve more {type} (for
        pagination). This ID will <em>not</em> be included in the returned list.
        Cannot be used with the <code>after</code> parameter.
      </ParamField>
      <Info>
        You can only use either <code>after</code> or <code>before</code>{' '}
        parameter, not both. See our{' '}
        <a href="/api-reference/pagination">pagination guide</a> for more
        information.
      </Info>
    </>;
};

By default, the API will return the most recent 20 templates. You can optionally use the `limit` parameter to return a different number of templates or control the pagination of the results with the `after` or `before` parameters.

<QueryParams type="templates" isRequired={true} />

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.templates.list({
    limit: 2,
    after: '34a080c9-b17d-4187-ad80-5af20266e535',
  });
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->templates->list([
    'limit' => 2,
    'after' => '34a080c9-b17d-4187-ad80-5af20266e535'
  ]);
  ```

  ```py Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Templates.list({
      "limit": 2,
      "after": "34a080c9-b17d-4187-ad80-5af20266e535",
  })
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Templates.list(
    limit: 2,
    after: "34a080c9-b17d-4187-ad80-5af20266e535"
  )
  ```

  ```go Go theme={null}
  import (
  	"context"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	templates, err := client.Templates.ListWithContext(context.TODO(), &resend.ListOptions{
  		Limit: 2,
  		After: "34a080c9-b17d-4187-ad80-5af20266e535",
  	})
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{list_opts::ListOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let list_opts = ListOptions::default()
      .with_limit(2)
      .list_after("34a080c9-b17d-4187-ad80-5af20266e535");

    let _list = resend.templates.list(list_opts).await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          ListParams params = ListParams.builder()
              .limit(2)
              .after("34a080c9-b17d-4187-ad80-5af20266e535")
              .build();

          ListTemplatesResponseSuccess data = resend.templates().list(params);
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.TemplateListAsync();
  Console.WriteLine( "Nr Templates={0}", resp.Content.Data.Count );
  ```

  ```bash cURL theme={null}
  curl -X GET 'https://api.resend.com/templates?limit=2&after=34a080c9-b17d-4187-ad80-5af20266e535' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "list",
    "data": [
      {
        "id": "e169aa45-1ecf-4183-9955-b1499d5701d3",
        "name": "reset-password",
        "status": "draft",
        "published_at": null,
        "created_at": "2023-10-06T23:47:56.678Z",
        "updated_at": "2023-10-06T23:47:56.678Z",
        "alias": "reset-password"
      },
      {
        "id": "b7f9c2e1-1234-4abc-9def-567890abcdef",
        "name": "welcome-message",
        "status": "published",
        "published_at": "2023-10-06T23:47:56.678Z",
        "created_at": "2023-10-06T23:47:56.678Z",
        "updated_at": "2023-10-06T23:47:56.678Z",
        "alias": "welcome-message"
      }
    ],
    "has_more": false
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Update Template

> Update a template.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

<ParamField body="id | alias" type="string">
  The ID or alias of the template to duplicate.
</ParamField>

## Body Parameters

<ParamField body="name" type="string">
  The name of the template.
</ParamField>

<ParamField body="html" type="string">
  The HTML version of the template.
</ParamField>

<ParamField body="alias" type="string">
  The alias of the template.
</ParamField>

<ParamField body="from" type="string">
  Sender email address.

  To include a friendly name, use the format `"Your Name <sender@domain.com>"`.

  If provided, this value can be overridden when sending an email using the template.
</ParamField>

<ParamField body="subject" type="string">
  Default email subject.

  This value can be overridden when sending an email using the template.
</ParamField>

<ResendParamField body="reply_to" type="string | string[]">
  Default Reply-to email address. For multiple addresses, send as an array of strings.

  This value can be overridden when sending an email using the template.
</ResendParamField>

<ParamField body="text" type="string">
  The plain text version of the message.

  <Info>
    If not provided, the HTML will be used to generate a plain text version. You can opt out of this behavior by setting value to an empty string.
  </Info>
</ParamField>

<ParamField body="react" type="React.ReactNode">
  The React component used to write the template. *Only available in the Node.js
  SDK.*
</ParamField>

<ParamField body="variables" type="array">
  The array of variables used in the template. Each template may contain up to 20 variables.

  Each variable is an object with the following properties:

  <Expandable defaultOpen="true" title="properties">
    <ParamField body="key" type="string" required>
      The key of the variable. We recommend capitalizing the key (e.g. `PRODUCT_NAME`). The following variable names are reserved and cannot be used:
      `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `RESEND_UNSUBSCRIBE_URL`, `contact`, and `this`.
    </ParamField>

    <ParamField body="type" type="'string' | 'number'" required>
      The type of the variable.

      Can be `'string'` or `'number'`
    </ParamField>

    <ResendParamField body="fallback_value">
      The fallback value of the variable. The value must match the type of the variable.

      If no fallback value is provided, you must provide a value for the variable when sending an email using the template.
    </ResendParamField>
  </Expandable>

  <Info>
    Before you can use a template, you must publish it first. To publish a
    template, use the [Templates dashboard](https://resend.com/templates) or
    [publish template API](/api-reference/templates/publish-template).

    [Learn more about Templates](/dashboard/templates/introduction).
  </Info>
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.templates.update(
    '34a080c9-b17d-4187-ad80-5af20266e535',
    {
      name: 'order-confirmation',
      html: '<p>Total: {{{PRICE}}}</p><p>Name: {{{PRODUCT}}}</p>',
    },
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->templates->update('34a080c9-b17d-4187-ad80-5af20266e535', [
    'name' => 'order-confirmation',
    'html' => '<p>Total: {{{PRICE}}}</p><p>Name: {{{PRODUCT}}}</p>',
  ]);
  ```

  ```py Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Templates.update({
      "id": "34a080c9-b17d-4187-ad80-5af20266e535",
      "name": "order-confirmation",
      "html": "<p>Total: {{{PRICE}}}</p><p>Name: {{{PRODUCT}}}</p>",
  })
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Templates.update("34a080c9-b17d-4187-ad80-5af20266e535", {
    name: "order-confirmation",
    html: "<p>Total: {{{PRICE}}}</p><p>Name: {{{PRODUCT}}}</p>"
  })
  ```

  ```go Go theme={null}
  import (
  	"context"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	template, err := client.Templates.UpdateWithContext(context.TODO(), "34a080c9-b17d-4187-ad80-5af20266e535", &resend.UpdateTemplateRequest{
  		Name: "order-confirmation",
  		Html: "<p>Total: {{{PRICE}}}</p><p>Name: {{{PRODUCT}}}</p>",
  	})
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{
    types::UpdateTemplateOptions,
    Resend, Result,
  };

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let name = "order-confirmation";
    let html = "<p>Total: {{{PRICE}}}</p><p>Name: {{{PRODUCT}}}</p>";

    let update = UpdateTemplateOptions::new(name, html);

    let _template = resend
      .templates
      .update("34a080c9-b17d-4187-ad80-5af20266e535", update)
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          UpdateTemplateOptions params = UpdateTemplateOptions.builder()
                  .name("order-confirmation")
                  .html("<p>Total: {{{PRICE}}}</p><p>Name: {{{PRODUCT}}}</p>")
                  .build();

          UpdateTemplateResponseSuccess data = resend.templates().update("34a080c9-b17d-4187-ad80-5af20266e535", params);
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  await resend.TemplateUpdateAsync(
      templateId: new Guid( "e169aa45-1ecf-4183-9955-b1499d5701d3" ),
      new TemplateData()
      {
          HtmlBody = "<p>Total: {{{PRICE}}}</p><p>Name: {{{PRODUCT}}}</p>",
      }
  );
  ```

  ```bash cURL theme={null}
  curl -X PATCH 'https://api.resend.com/templates/34a080c9-b17d-4187-ad80-5af20266e535' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "name": "order-confirmation",
    "html": "<p>Total: {{{PRICE}}}</p><p>Name: {{{PRODUCT}}}</p>"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "id": "34a080c9-b17d-4187-ad80-5af20266e535",
    "object": "template"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Delete Template

> Delete a template.

## Path Parameters

<ParamField body="id | alias" type="string">
  The ID or alias of the template to delete.
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.templates.remove(
    '34a080c9-b17d-4187-ad80-5af20266e535',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->templates->remove('34a080c9-b17d-4187-ad80-5af20266e535');
  ```

  ```py Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Templates.remove("34a080c9-b17d-4187-ad80-5af20266e535")
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Templates.remove("34a080c9-b17d-4187-ad80-5af20266e535")
  ```

  ```go Go theme={null}
  import (
  	"context"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	template, err := client.Templates.RemoveWithContext(
  		context.TODO(),
  		"34a080c9-b17d-4187-ad80-5af20266e535",
  	)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _deleted = resend
      .templates
      .delete("34a080c9-b17d-4187-ad80-5af20266e535")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          DeleteTemplateResponseSuccess data = resend.templates().remove("34a080c9-b17d-4187-ad80-5af20266e535");
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  await resend.TemplateDeleteAsync( new Guid( "34a080c9-b17d-4187-ad80-5af20266e535" ) );
  ```

  ```bash cURL theme={null}
  curl -X DELETE 'https://api.resend.com/templates/34a080c9-b17d-4187-ad80-5af20266e535' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "template",
    "id": "34a080c9-b17d-4187-ad80-5af20266e535",
    "deleted": true
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Publish Template

> Publish a template.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Path Parameters

<ParamField body="id | alias" type="string">
  The ID or alias of the template to publish.
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.templates.publish(
    '34a080c9-b17d-4187-ad80-5af20266e535',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->templates->publish('34a080c9-b17d-4187-ad80-5af20266e535');
  ```

  ```py Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Templates.publish("34a080c9-b17d-4187-ad80-5af20266e535")
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Templates.publish("34a080c9-b17d-4187-ad80-5af20266e535")
  ```

  ```go Go theme={null}
  import (
  	"context"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	template, err := client.Templates.PublishWithContext(
  		context.TODO(),
  		"34a080c9-b17d-4187-ad80-5af20266e535",
  	)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _published = resend
      .templates
      .publish("34a080c9-b17d-4187-ad80-5af20266e535")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          PublishTemplateResponseSuccess data = resend.templates().publish("34a080c9-b17d-4187-ad80-5af20266e535");
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  await resend.TemplatePublishAsync( new Guid( "34a080c9-b17d-4187-ad80-5af20266e535" ) );
  ```

  ```bash cURL theme={null}
  curl -X POST 'https://api.resend.com/templates/34a080c9-b17d-4187-ad80-5af20266e535/publish' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "id": "34a080c9-b17d-4187-ad80-5af20266e535",
    "object": "template"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt# Duplicate Template

> Duplicate a template.

## Path Parameters

<ParamField body="id | alias" type="string">
  The ID or alias of the template to duplicate.
</ParamField>

<RequestExample>
  ```ts Node.js theme={null}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.templates.duplicate(
    '34a080c9-b17d-4187-ad80-5af20266e535',
  );
  ```

  ```php PHP theme={null}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->templates->duplicate('34a080c9-b17d-4187-ad80-5af20266e535');
  ```

  ```py Python theme={null}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  resend.Templates.duplicate("34a080c9-b17d-4187-ad80-5af20266e535")
  ```

  ```ruby Ruby theme={null}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  Resend::Templates.duplicate("34a080c9-b17d-4187-ad80-5af20266e535")
  ```

  ```go Go theme={null}
  import (
  	"context"

  	"github.com/resend/resend-go/v3"
  )

  func main() {
  	client := resend.NewClient("re_xxxxxxxxx")

  	template, err := client.Templates.DuplicateWithContext(
  		context.TODO(),
  		"34a080c9-b17d-4187-ad80-5af20266e535",
  	)
  }
  ```

  ```rust Rust theme={null}
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _duplicated = resend
      .templates
      .duplicate("34a080c9-b17d-4187-ad80-5af20266e535")
      .await?;

    Ok(())
  }
  ```

  ```java Java theme={null}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          DuplicateTemplateResponseSuccess data = resend.templates().duplicate("34a080c9-b17d-4187-ad80-5af20266e535");
      }
  }
  ```

  ```csharp .NET theme={null}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  await resend.TemplateDuplicateAsync( new Guid( "34a080c9-b17d-4187-ad80-5af20266e535" ) );
  ```

  ```bash cURL theme={null}
  curl -X POST 'https://api.resend.com/templates/34a080c9-b17d-4187-ad80-5af20266e535/duplicate' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json'
  ```
</RequestExample>

<ResponseExample>
  ```json Response theme={null}
  {
    "object": "template",
    "id": "e169aa45-1ecf-4183-9955-b1499d5701d3"
  }
  ```
</ResponseExample>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://resend.com/docs/llms.txt