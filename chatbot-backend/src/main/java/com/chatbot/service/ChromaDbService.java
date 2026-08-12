package com.chatbot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChromaDbService {

    @Value("${app.chromadb.base-url}")
    private String chromaUrl;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    // ─── Collection Management ───────────────────────────────────────────────────

    public String createCollection(String name) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("name", name);
            body.put("get_or_create", true);

            String response = webClient.post()
                    .uri(chromaUrl + "/api/v1/collections")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(response);
            return root.path("id").asText();
        } catch (Exception e) {
            log.error("Error creating ChromaDB collection: {}", e.getMessage());
            throw new RuntimeException("ChromaDB collection creation failed");
        }
    }

    public void deleteCollection(String collectionId) {
        try {
            webClient.delete()
                    .uri(chromaUrl + "/api/v1/collections/" + collectionId)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception e) {
            log.warn("Could not delete collection {}: {}", collectionId, e.getMessage());
        }
    }

    // ─── Add Embeddings ──────────────────────────────────────────────────────────

    public void addEmbeddings(String collectionId,
                               List<String> chunks,
                               List<List<Double>> embeddings,
                               String documentId) {
        try {
            ObjectNode body = objectMapper.createObjectNode();

            ArrayNode ids        = body.putArray("ids");
            ArrayNode embeds     = body.putArray("embeddings");
            ArrayNode docs       = body.putArray("documents");
            ArrayNode metadatas  = body.putArray("metadatas");

            for (int i = 0; i < chunks.size(); i++) {
                String chunkId = documentId + "_chunk_" + i;
                ids.add(chunkId);
                docs.add(chunks.get(i));

                ArrayNode embeddingArr = embeds.addArray();
                for (Double val : embeddings.get(i)) {
                    embeddingArr.add(val);
                }

                ObjectNode meta = metadatas.addObject();
                meta.put("documentId", documentId);
                meta.put("chunkIndex", i);
            }

            webClient.post()
                    .uri(chromaUrl + "/api/v1/collections/" + collectionId + "/add")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            log.info("Added {} embeddings to collection {}", chunks.size(), collectionId);
        } catch (Exception e) {
            log.error("Error adding embeddings: {}", e.getMessage());
            throw new RuntimeException("Failed to store embeddings");
        }
    }

    // ─── Query Similar Chunks ────────────────────────────────────────────────────

    public List<String> querySimilarChunks(String collectionId,
                                            List<Double> queryEmbedding,
                                            int topK) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("n_results", topK);

            ArrayNode queryEmbeddings = body.putArray("query_embeddings");
            ArrayNode embArr = queryEmbeddings.addArray();
            for (Double val : queryEmbedding) embArr.add(val);

            String response = webClient.post()
                    .uri(chromaUrl + "/api/v1/collections/" + collectionId + "/query")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = objectMapper.readTree(response);
            JsonNode docs = root.path("documents").get(0);

            List<String> chunks = new ArrayList<>();
            docs.forEach(d -> chunks.add(d.asText()));
            return chunks;
        } catch (Exception e) {
            log.error("Error querying ChromaDB: {}", e.getMessage());
            return List.of();
        }
    }
}
