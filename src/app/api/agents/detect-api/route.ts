import { NextRequest, NextResponse } from "next/server";

interface DetectionResult {
    apiType: "graphql" | "openapi" | "rest";
    schema?: string;
    detectedAt: string;
    confidence: "high" | "medium" | "low";
    message: string;
}

// GraphQL introspection query to get types
const GRAPHQL_INTROSPECTION = `
query IntrospectionQuery {
  __schema {
    queryType { name }
    types {
      name
      kind
      fields {
        name
        type { name kind ofType { name kind } }
      }
    }
  }
}
`;

// Simplified introspection for just the query types
const GRAPHQL_SIMPLE_INTROSPECTION = `
query {
  __schema {
    queryType {
      fields {
        name
        description
        args { name type { name kind } }
        type { name kind ofType { name } }
      }
    }
  }
}
`;

export async function POST(request: NextRequest) {
    try {
        const { url, apiKey, headers: customHeaders } = await request.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }
        
        // Validate URL format
        try {
            new URL(url);
        } catch {
            return NextResponse.json({ 
                error: "Invalid URL format", 
                details: "Please enter a valid URL starting with http:// or https://" 
            }, { status: 400 });
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...customHeaders
        };

        if (apiKey) {
            headers["Authorization"] = `Bearer ${apiKey}`;
        }

        const result: DetectionResult = {
            apiType: "rest",
            detectedAt: new Date().toISOString(),
            confidence: "low",
            message: "Defaulting to REST API"
        };

        // Try GraphQL introspection first
        try {
            console.log(`[API Detection] Trying GraphQL introspection for ${url}`);
            const graphqlResponse = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify({ query: GRAPHQL_SIMPLE_INTROSPECTION }),
                signal: AbortSignal.timeout(10000)
            });

            if (graphqlResponse.ok) {
                const data = await graphqlResponse.json();
                
                if (data?.data?.__schema) {
                    result.apiType = "graphql";
                    result.confidence = "high";
                    result.message = "GraphQL API detected via introspection";
                    
                    // Extract useful schema information
                    const queryFields = data.data.__schema?.queryType?.fields || [];
                    const schemaInfo = queryFields.slice(0, 20).map((field: {
                        name: string;
                        description?: string;
                        args?: Array<{ name: string; type: { name?: string; kind?: string } }>;
                        type: { name?: string; kind?: string; ofType?: { name?: string } };
                    }) => {
                        const args = field.args?.map((arg: { name: string; type: { name?: string; kind?: string } }) => 
                            `${arg.name}: ${arg.type.name || arg.type.kind}`
                        ).join(", ") || "";
                        const returnType = field.type.name || field.type.ofType?.name || field.type.kind;
                        return `${field.name}(${args}): ${returnType}${field.description ? ` - ${field.description}` : ""}`;
                    });
                    
                    result.schema = `GraphQL Query Types:\n${schemaInfo.join("\n")}`;
                    
                    return NextResponse.json(result);
                }
            }
        } catch (e) {
            console.log(`[API Detection] GraphQL introspection failed:`, e);
        }

        // Try OpenAPI/Swagger detection
        const openApiPaths = [
            "/openapi.json",
            "/swagger.json",
            "/api-docs",
            "/v1/openapi.json",
            "/v2/swagger.json",
            "/api/openapi.json"
        ];

        for (const path of openApiPaths) {
            try {
                const baseUrl = new URL(url).origin;
                const openApiUrl = `${baseUrl}${path}`;
                console.log(`[API Detection] Trying OpenAPI at ${openApiUrl}`);
                
                const openApiResponse = await fetch(openApiUrl, {
                    headers: { ...headers, "Accept": "application/json" },
                    signal: AbortSignal.timeout(5000)
                });

                if (openApiResponse.ok) {
                    const spec = await openApiResponse.json();
                    
                    if (spec.openapi || spec.swagger) {
                        result.apiType = "openapi";
                        result.confidence = "high";
                        result.message = `OpenAPI ${spec.openapi || spec.swagger} specification found`;
                        
                        // Extract key endpoints
                        const paths = Object.keys(spec.paths || {}).slice(0, 15);
                        const endpoints = paths.map(p => {
                            const methods = Object.keys(spec.paths[p]).filter(m => 
                                ["get", "post", "put", "delete", "patch"].includes(m)
                            );
                            const methodDetails = methods.map(m => {
                                const op = spec.paths[p][m];
                                return `${m.toUpperCase()}: ${op.summary || op.description || ""}`;
                            });
                            return `${p}\n  ${methodDetails.join("\n  ")}`;
                        });
                        
                        result.schema = `OpenAPI Endpoints:\n${endpoints.join("\n\n")}`;
                        
                        return NextResponse.json(result);
                    }
                }
            } catch {
                // Continue to next path
            }
        }

        // Check if URL contains hints
        const urlLower = url.toLowerCase();
        if (urlLower.includes("graphql") || urlLower.includes("thegraph.com") || urlLower.includes("subgraph")) {
            result.apiType = "graphql";
            result.confidence = "medium";
            result.message = "GraphQL API detected from URL pattern (introspection failed - may need API key)";
        } else if (urlLower.includes("swagger") || urlLower.includes("openapi")) {
            result.apiType = "openapi";
            result.confidence = "medium";
            result.message = "OpenAPI detected from URL pattern";
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[API Detection] Error:", error);
        return NextResponse.json({ 
            error: "Failed to detect API type",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

