package edu.kit.quak.infrastructure.config;

import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class OAuth2UserEnrichmentService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    @SuppressWarnings("null")
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = delegate.loadUser(userRequest);
        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        if ("github".equalsIgnoreCase(registrationId)) {
            return enrichGithubUser(userRequest, oAuth2User);
        }

        // FUTURE: If other providers hide the email too, handle them here.
        // if ("gitlab".equalsIgnoreCase(registrationId)) {
        // return enrichGitlabUser(userRequest, oAuth2User);
        // }

        return oAuth2User;
    }

    @SuppressWarnings({ "unchecked", "rawtypes" })
    private OAuth2User enrichGithubUser(OAuth2UserRequest userRequest, OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        if (email != null) {
            return oAuth2User; // Email is already public
        }

        // Fetch primary verified email from GitHub API
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(userRequest.getAccessToken().getTokenValue());
        HttpEntity<String> entity = new HttpEntity<>("parameters", headers);

        ResponseEntity<Map[]> response = restTemplate.exchange("https://api.github.com/user/emails", HttpMethod.GET, entity, Map[].class);

        Map[] emails = response.getBody();
        if (emails != null) {
            for (Map emailObjRaw : emails) {
                Map<String, Object> emailObj = (Map<String, Object>) emailObjRaw;
                if (Boolean.TRUE.equals(emailObj.get("primary")) && Boolean.TRUE.equals(emailObj.get("verified"))) {
                    Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());
                    attributes.put("email", emailObj.get("email"));

                    String userNameAttributeName = userRequest
                        .getClientRegistration()
                        .getProviderDetails()
                        .getUserInfoEndpoint()
                        .getUserNameAttributeName();

                    return new DefaultOAuth2User(oAuth2User.getAuthorities(), attributes, userNameAttributeName);
                }
            }
        }

        return oAuth2User;
    }
}
