using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

var client = new HttpClient();
// First we need a valid JWT token to call the endpoint.
// Let's just grep the last exception from the log if we can, or write a script to check Lead constraints.
