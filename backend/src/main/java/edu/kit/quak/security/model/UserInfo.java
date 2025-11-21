package edu.kit.quak.security.model;

public class UserInfo {
    private String email;
    private String name;
    private String picture;
    private String sub;

    public UserInfo() {
    }

    public UserInfo(String email, String name, String picture, String sub) {
        this.email = email;
        this.name = name;
        this.picture = picture;
        this.sub = sub;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPicture() {
        return picture;
    }

    public void setPicture(String picture) {
        this.picture = picture;
    }

    public String getSub() {
        return sub;
    }

    public void setSub(String sub) {
        this.sub = sub;
    }
}
