"use client";

import { Document, Page, Text, View, StyleSheet, PDFViewer } from "@react-pdf/renderer";
import { CVProfile, CVTemplate } from "@/types/cv";

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: "Helvetica",
        fontSize: 10,
        color: "#333",
    },
    section: {
        marginBottom: 10,
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingBottom: 10,
    },
    name: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 5,
    },
    title: {
        fontSize: 14,
        color: "#666",
        marginBottom: 5,
    },
    contact: {
        flexDirection: "row",
        gap: 10,
        fontSize: 9,
        color: "#888",
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 6,
        textTransform: "uppercase",
        color: "#444",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingBottom: 3,
    },
    jobTitle: {
        fontSize: 11,
        fontWeight: "bold",
    },
    company: {
        fontSize: 10,
        color: "#555",
    },
    date: {
        fontSize: 9,
        color: "#888",
    },
    bullet: {
        marginLeft: 10,
        marginBottom: 2,
    },
});

interface CVDocumentProps {
    profile: CVProfile;
    template: CVTemplate;
}

const CVDocument = ({ profile, template }: CVDocumentProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.name}>{profile.fullName || "Your Name"}</Text>
                <Text style={styles.title}>{profile.title || "Professional Title"}</Text>
                <View style={styles.contact}>
                    {profile.contact.email && <Text>{profile.contact.email}</Text>}
                    {profile.contact.phone && <Text>• {profile.contact.phone}</Text>}
                    {profile.contact.location && <Text>• {profile.contact.location}</Text>}
                </View>
                <View style={[styles.contact, { marginTop: 4 }]}>
                    {profile.contact.linkedin && <Text>LinkedIn: {profile.contact.linkedin}</Text>}
                    {profile.contact.github && <Text>• GitHub: {profile.contact.github}</Text>}
                </View>
            </View>

            {/* Summary */}
            {profile.summary && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Professional Summary</Text>
                    <Text>{profile.summary}</Text>
                </View>
            )}

            {/* Experience */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Experience</Text>
                {profile.experience.map((exp) => (
                    <View key={exp.id} style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                            <Text style={styles.jobTitle}>{exp.role}</Text>
                            <Text style={styles.date}>{exp.duration}</Text>
                        </View>
                        <Text style={styles.company}>{exp.company}</Text>
                        <Text style={{ marginTop: 3 }}>{exp.description}</Text>
                    </View>
                ))}
            </View>

            {/* Skills */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
                    {profile.skills.map(cat => (
                        <View key={cat.category} style={{ marginBottom: 4 }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 9 }}>{cat.category}: </Text>
                            <Text>{cat.items.join(", ")}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </Page>
    </Document>
);

export function LiveCVPreview({ profile, template }: CVDocumentProps) {
    return (
        <div className="w-full h-full bg-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-inner">
            <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none">
                < CVDocument profile={profile} template={template} />
            </PDFViewer>
        </div>
    );
}
