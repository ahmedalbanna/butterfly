--
-- PostgreSQL database dump
--

\restrict KYZ9OfYxn1uEbsc1aL1sBzPf6HebhV7Whuys848IDfae5l8zO9hrEoBcFQIkjqn

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: luxefinds_admin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO luxefinds_admin;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: luxefinds_admin
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ActiveChatSession; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."ActiveChatSession" (
    id text NOT NULL,
    "messageId" text NOT NULL,
    "customerConnected" boolean DEFAULT false NOT NULL,
    "adminConnected" boolean DEFAULT false NOT NULL,
    "adminName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastActivity" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ActiveChatSession" OWNER TO luxefinds_admin;

--
-- Name: Cart; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."Cart" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Cart" OWNER TO luxefinds_admin;

--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."CartItem" (
    id text NOT NULL,
    "cartId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CartItem" OWNER TO luxefinds_admin;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Category" OWNER TO luxefinds_admin;

--
-- Name: ChatSession; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."ChatSession" (
    id text NOT NULL,
    "userId" text,
    "sessionId" text NOT NULL,
    messages jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChatSession" OWNER TO luxefinds_admin;

--
-- Name: CustomerMessage; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."CustomerMessage" (
    id text NOT NULL,
    "customerName" text NOT NULL,
    "customerEmail" text NOT NULL,
    "customerPhone" text,
    subject text NOT NULL,
    message text NOT NULL,
    "orderId" text,
    status text DEFAULT 'unread'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    type text DEFAULT 'form'::text NOT NULL
);


ALTER TABLE public."CustomerMessage" OWNER TO luxefinds_admin;

--
-- Name: MessageReply; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."MessageReply" (
    id text NOT NULL,
    "messageId" text NOT NULL,
    sender text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageReply" OWNER TO luxefinds_admin;

--
-- Name: Order; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "userId" text,
    status text DEFAULT 'pending'::text NOT NULL,
    total double precision NOT NULL,
    "shippingAddress" text NOT NULL,
    "billingAddress" text NOT NULL,
    "customerEmail" text NOT NULL,
    "customerName" text NOT NULL,
    "customerPhone" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Order" OWNER TO luxefinds_admin;

--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO luxefinds_admin;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    "categoryId" text NOT NULL,
    price double precision NOT NULL,
    description text NOT NULL,
    materials text NOT NULL,
    care text NOT NULL,
    image text NOT NULL,
    images text[],
    featured boolean DEFAULT false NOT NULL,
    stock integer DEFAULT 100 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO luxefinds_admin;

--
-- Name: User; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO luxefinds_admin;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: luxefinds_admin
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO luxefinds_admin;

--
-- Data for Name: ActiveChatSession; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."ActiveChatSession" (id, "messageId", "customerConnected", "adminConnected", "adminName", "createdAt", "lastActivity") FROM stdin;
\.


--
-- Data for Name: Cart; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."Cart" (id, "userId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."CartItem" (id, "cartId", "productId", quantity, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."Category" (id, name, slug, description, "displayOrder", "createdAt", "updatedAt") FROM stdin;
cat1	Jewelry	jewelry	Exquisite jewelry pieces crafted with precision and elegance	1	2026-01-31 16:09:49.731	2026-01-31 16:09:49.731
cat2	Watches	watches	Timeless timepieces that blend artistry with function	2	2026-01-31 16:09:49.737	2026-01-31 16:09:49.737
cat3	Bags	bags	Luxurious handbags and accessories for the discerning collector	3	2026-01-31 16:09:49.739	2026-01-31 16:09:49.739
cat4	Accessories	accessories	Refined accessories to complete your sophisticated look	4	2026-01-31 16:09:49.741	2026-01-31 16:09:49.741
cml2ig2je0001np251u5o5ti9	بطاط	potat	ksfj	5	2026-01-31 16:12:34.394	2026-01-31 16:12:34.394
\.


--
-- Data for Name: ChatSession; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."ChatSession" (id, "userId", "sessionId", messages, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CustomerMessage; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."CustomerMessage" (id, "customerName", "customerEmail", "customerPhone", subject, message, "orderId", status, priority, "createdAt", "updatedAt", "isActive", type) FROM stdin;
cml2l4qut0000ji2565dbjovj	Ahmed	albanaawork@gmail.com	+967772909766	Inquiry about Order #YSCFVOO9	How can hs	cml2jen2d0002ob25yscfvoo9	replied	normal	2026-01-31 17:27:44.883	2026-01-31 17:28:22.126	f	form
cml2mgn760002a125vbqat63d	Ahmed	albanaawork@gmail.com	+967772909766	Inquiry about Order #C92FPAPU	ksjfksjsfkjsf	cml2mg8fl0000a125c92fpapu	unread	normal	2026-01-31 18:04:59.633	2026-01-31 18:04:59.633	f	form
\.


--
-- Data for Name: MessageReply; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."MessageReply" (id, "messageId", sender, content, "createdAt") FROM stdin;
cml2l5jl80001ji2590j0516t	cml2l4qut0000ji2565dbjovj	admin	howoo	2026-01-31 17:28:22.124
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."Order" (id, "userId", status, total, "shippingAddress", "billingAddress", "customerEmail", "customerName", "customerPhone", "createdAt", "updatedAt") FROM stdin;
cml2j4h0k0000ob2534g5kbz9	\N	pending	320	Al-Nahhda, Yemen, Sanaa	Al-Nahhda, Yemen, Sanaa	albanaawork@gmail.com	Ahmed	+967772909766	2026-01-31 16:31:32.885	2026-01-31 16:31:32.885
cml2jen2d0002ob25yscfvoo9	\N	delivered	3630	Al-Nahhda Yemen	Al-Nahhda Yemen	albanaawork@gmail.com	Ahmed	+967772909766	2026-01-31 16:39:27.291	2026-01-31 16:41:22.648
cml2mg8fl0000a125c92fpapu	\N	pending	640	Al-Nahddah,Yemen	Al-Nahddah,Yemen	albanaawork@gmail.com	Ahmed	+967772909766	2026-01-31 18:04:40.485	2026-01-31 18:04:40.485
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."OrderItem" (id, "orderId", "productId", quantity, price, "createdAt") FROM stdin;
cml2j4h0p0001ob254v2m5o55	cml2j4h0k0000ob2534g5kbz9	p2	1	320	2026-01-31 16:31:32.885
cml2jen2g0003ob254fyqme77	cml2jen2d0002ob25yscfvoo9	p2	3	320	2026-01-31 16:39:27.291
cml2jen2g0004ob25au4inlr1	cml2jen2d0002ob25yscfvoo9	p4	3	890	2026-01-31 16:39:27.291
cml2mg8fp0001a125c1hlpmbf	cml2mg8fl0000a125c92fpapu	p2	2	320	2026-01-31 18:04:40.485
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."Product" (id, name, "categoryId", price, description, materials, care, image, images, featured, stock, "createdAt", "updatedAt") FROM stdin;
p1	Rose Gold Diamond Necklace	cat1	1250	A timeless piece featuring a brilliant round-cut diamond set in 18k rose gold. Elegant enough for special occasions, yet subtle for everyday luxury.	18k Rose Gold, 0.5ct Diamond (VVS1)	Clean with a soft polishing cloth. Avoid contact with perfumes and lotions.	https://images.unsplash.com/photo-1724937721228-f7bf3df2a4d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxkaWFtb25kJTIwbmVja2xhY2V8ZW58MHx8fHwxNzY5NzQ5MjIyfDA&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1724937721228-f7bf3df2a4d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxkaWFtb25kJTIwbmVja2xhY2V8ZW58MHx8fHwxNzY5NzQ5MjIyfDA&ixlib=rb-4.1.0&q=80&w=1080,https://images.unsplash.com/photo-1758995116288-278d7387cbb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8amV3ZWxyeSUyMGRldGFpbHxlbnwwfHx8fDE3Njk3ODkyOTN8MA&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux1detail/800/800}	f	100	2026-01-31 16:09:49.746	2026-01-31 16:09:49.746
p2	Minimalist Gold Hoop Earrings	cat1	320	Crafted for modern simplicity, these thin gold hoops are lightweight and versatile.	14k Yellow Gold	Store in a dry place. Wipe with microfiber after each use.	https://images.unsplash.com/photo-1671644730555-916aa8d8157f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxnb2xkJTIwZWFycmluZ3N8ZW58MHx8fHwxNzY5NzEwNzA5fDA&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1671644730555-916aa8d8157f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxnb2xkJTIwZWFycmluZ3N8ZW58MHx8fHwxNzY5NzEwNzA5fDA&ixlib=rb-4.1.0&q=80&w=1080,https://images.unsplash.com/photo-1751551683594-ab054a031696?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxlYXJyaW5ncyUyMGNsb3NlfGVufDB8fHx8MTc2OTc4OTI5M3ww&ixlib=rb-4.1.0&q=80&w=1080}	t	100	2026-01-31 16:09:49.75	2026-01-31 16:09:49.75
p3	Classic Pearl Bracelet	cat1	450	Hand-selected freshwater pearls on a delicate silk cord with a rose gold clasp.	Freshwater Pearls, Rose Gold Clasp	Avoid water contact. Restring annually if worn frequently.	https://images.unsplash.com/photo-1704203355458-b36cb43eacf8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxwZWFybCUyMGJyYWNlbGV0fGVufDB8fHx8MTc2OTY4NDQ3Nnww&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1704203355458-b36cb43eacf8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxwZWFybCUyMGJyYWNlbGV0fGVufDB8fHx8MTc2OTY4NDQ3Nnww&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux3alt/800/800}	f	100	2026-01-31 16:09:49.753	2026-01-31 16:09:49.753
p4	Luxe Heritage Rose Watch	cat2	890	A masterpiece of horology. Features a sapphire crystal face and a precision Swiss movement.	Stainless Steel with Rose Gold PVD, Sapphire Crystal	Water resistant to 50m. Service every 3-5 years.	https://images.unsplash.com/photo-1548169874-53e85f753f1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxsdXh1cnklMjB3YXRjaHxlbnwwfHx8fDE3Njk3MzA4NDN8MA&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1548169874-53e85f753f1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxsdXh1cnklMjB3YXRjaHxlbnwwfHx8fDE3Njk3MzA4NDN8MA&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux4alt/800/800}	t	100	2026-01-31 16:09:49.756	2026-01-31 16:09:49.756
p5	Petite Leather Clutch	cat3	640	Handcrafted from Italian calfskin, this clutch features a minimalist design and a hidden magnetic closure.	Full-grain Italian Leather, Satin Lining	Treat with leather conditioner periodically.	https://images.unsplash.com/photo-1644308992821-6feb6375c89b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxsZWF0aGVyJTIwY2x1dGNofGVufDB8fHx8MTc2OTc4OTI5M3ww&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1644308992821-6feb6375c89b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxsZWF0aGVyJTIwY2x1dGNofGVufDB8fHx8MTc2OTc4OTI5M3ww&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux5alt/800/800}	f	100	2026-01-31 16:09:49.759	2026-01-31 16:09:49.759
p7	Botanical Silk Scarf	cat4	180	Hand-painted floral motifs on 100% pure mulberry silk.	100% Mulberry Silk	Dry clean only.	https://images.unsplash.com/photo-1517472292914-9570a594783b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxzaWxrJTIwc2NhcmZ8ZW58MHx8fHwxNzY5NzUzNDMwfDA&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1517472292914-9570a594783b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxzaWxrJTIwc2NhcmZ8ZW58MHx8fHwxNzY5NzUzNDMwfDA&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux7alt/800/800}	f	100	2026-01-31 16:09:49.764	2026-01-31 16:09:49.764
p8	Emerald Cut Ring	cat1	2100	A striking emerald-cut diamond ring that captures the light from every angle.	Platinum, 1.2ct Lab-Grown Diamond	Professional cleaning recommended every 6 months.	https://images.unsplash.com/photo-1719924998065-0c60e329ef58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxkaWFtb25kJTIwcmluZ3xlbnwwfHx8fDE3Njk3NzE4NjB8MA&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1719924998065-0c60e329ef58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxkaWFtb25kJTIwcmluZ3xlbnwwfHx8fDE3Njk3NzE4NjB8MA&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux8alt/800/800}	f	100	2026-01-31 16:09:49.767	2026-01-31 16:09:49.767
p6	إطارات قذيفة السلحفاة	cml2ig2je0001np251u5o5ti9	210	أنماط غلاف السلحفاة الكلاسيكية مع حماية من الأشعة فوق البنفسجية 400. لا غنى عنه للأيام المشمسة.	خلات، عدسات CR-39	قم بالتنظيف باستخدام رذاذ العدسة والقماش المرفقين.	https://images.unsplash.com/photo-1760446032732-c042b0d43580?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxmYXNoaW9uJTIwc3VuZ2xhc3Nlc3xlbnwwfHx8fDE3Njk3ODkyOTN8MA&ixlib=rb-4.1.0&q=80&w=1080	{https://images.unsplash.com/photo-1760446032732-c042b0d43580?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxmYXNoaW9uJTIwc3VuZ2xhc3Nlc3xlbnwwfHx8fDE3Njk3ODkyOTN8MA&ixlib=rb-4.1.0&q=80&w=1080,https://picsum.photos/seed/lux6alt/800/800}	t	100	2026-01-31 16:09:49.762	2026-01-31 16:13:54.378
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public."User" (id, email, name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: luxefinds_admin
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
40839671-6a77-4b17-bc26-d2f19f97abe1	41a35694175acd90da6da16911ecf106bb9b3623001670b288954ad4e0e672fc	2026-01-31 15:43:22.160785+00	20260131154322_add_category_model	\N	\N	2026-01-31 15:43:22.06226+00	1
4c5324ff-906b-4cff-a105-9162f88bf278	3568640a10ab367d02d577f174af2156d33ec041e46418bd2ae61228f1bb30ec	2026-01-31 17:20:36.502405+00	20260131172036_add_customer_messaging	\N	\N	2026-01-31 17:20:36.476563+00	1
0d533e9c-ce85-4e52-ab38-8564c13f0c53	78d3c0ca28ba9d52773834706a14d02acd38fb6760d2a7b5f27dcdcc283904e3	2026-01-31 17:47:43.635554+00	20260131174743_add_chat_session_tracking	\N	\N	2026-01-31 17:47:43.610529+00	1
\.


--
-- Name: ActiveChatSession ActiveChatSession_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."ActiveChatSession"
    ADD CONSTRAINT "ActiveChatSession_pkey" PRIMARY KEY (id);


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: Cart Cart_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: ChatSession ChatSession_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."ChatSession"
    ADD CONSTRAINT "ChatSession_pkey" PRIMARY KEY (id);


--
-- Name: CustomerMessage CustomerMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."CustomerMessage"
    ADD CONSTRAINT "CustomerMessage_pkey" PRIMARY KEY (id);


--
-- Name: MessageReply MessageReply_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."MessageReply"
    ADD CONSTRAINT "MessageReply_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ActiveChatSession_adminConnected_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "ActiveChatSession_adminConnected_idx" ON public."ActiveChatSession" USING btree ("adminConnected");


--
-- Name: ActiveChatSession_customerConnected_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "ActiveChatSession_customerConnected_idx" ON public."ActiveChatSession" USING btree ("customerConnected");


--
-- Name: ActiveChatSession_lastActivity_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "ActiveChatSession_lastActivity_idx" ON public."ActiveChatSession" USING btree ("lastActivity");


--
-- Name: ActiveChatSession_messageId_key; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE UNIQUE INDEX "ActiveChatSession_messageId_key" ON public."ActiveChatSession" USING btree ("messageId");


--
-- Name: CartItem_cartId_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "CartItem_cartId_idx" ON public."CartItem" USING btree ("cartId");


--
-- Name: CartItem_cartId_productId_key; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON public."CartItem" USING btree ("cartId", "productId");


--
-- Name: Cart_userId_key; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE UNIQUE INDEX "Cart_userId_key" ON public."Cart" USING btree ("userId");


--
-- Name: Category_displayOrder_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "Category_displayOrder_idx" ON public."Category" USING btree ("displayOrder");


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: Category_slug_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "Category_slug_idx" ON public."Category" USING btree (slug);


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: ChatSession_createdAt_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "ChatSession_createdAt_idx" ON public."ChatSession" USING btree ("createdAt");


--
-- Name: ChatSession_sessionId_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "ChatSession_sessionId_idx" ON public."ChatSession" USING btree ("sessionId");


--
-- Name: ChatSession_sessionId_key; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE UNIQUE INDEX "ChatSession_sessionId_key" ON public."ChatSession" USING btree ("sessionId");


--
-- Name: ChatSession_userId_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "ChatSession_userId_idx" ON public."ChatSession" USING btree ("userId");


--
-- Name: CustomerMessage_createdAt_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "CustomerMessage_createdAt_idx" ON public."CustomerMessage" USING btree ("createdAt");


--
-- Name: CustomerMessage_customerEmail_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "CustomerMessage_customerEmail_idx" ON public."CustomerMessage" USING btree ("customerEmail");


--
-- Name: CustomerMessage_isActive_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "CustomerMessage_isActive_idx" ON public."CustomerMessage" USING btree ("isActive");


--
-- Name: CustomerMessage_orderId_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "CustomerMessage_orderId_idx" ON public."CustomerMessage" USING btree ("orderId");


--
-- Name: CustomerMessage_priority_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "CustomerMessage_priority_idx" ON public."CustomerMessage" USING btree (priority);


--
-- Name: CustomerMessage_status_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "CustomerMessage_status_idx" ON public."CustomerMessage" USING btree (status);


--
-- Name: CustomerMessage_type_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "CustomerMessage_type_idx" ON public."CustomerMessage" USING btree (type);


--
-- Name: MessageReply_createdAt_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "MessageReply_createdAt_idx" ON public."MessageReply" USING btree ("createdAt");


--
-- Name: MessageReply_messageId_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "MessageReply_messageId_idx" ON public."MessageReply" USING btree ("messageId");


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: Order_createdAt_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "Order_createdAt_idx" ON public."Order" USING btree ("createdAt");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "Order_status_idx" ON public."Order" USING btree (status);


--
-- Name: Order_userId_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "Order_userId_idx" ON public."Order" USING btree ("userId");


--
-- Name: Product_categoryId_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "Product_categoryId_idx" ON public."Product" USING btree ("categoryId");


--
-- Name: Product_featured_idx; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE INDEX "Product_featured_idx" ON public."Product" USING btree (featured);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: luxefinds_admin
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: ActiveChatSession ActiveChatSession_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."ActiveChatSession"
    ADD CONSTRAINT "ActiveChatSession_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."CustomerMessage"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public."Cart"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Cart Cart_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatSession ChatSession_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."ChatSession"
    ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CustomerMessage CustomerMessage_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."CustomerMessage"
    ADD CONSTRAINT "CustomerMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MessageReply MessageReply_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."MessageReply"
    ADD CONSTRAINT "MessageReply_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."CustomerMessage"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: luxefinds_admin
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: luxefinds_admin
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict KYZ9OfYxn1uEbsc1aL1sBzPf6HebhV7Whuys848IDfae5l8zO9hrEoBcFQIkjqn

